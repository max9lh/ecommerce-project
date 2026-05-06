-- TABLA DE USUARIOS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pct_merchandise DECIMAL(3, 2) DEFAULT 0.60,
    pct_fixed_expenses DECIMAL(3, 2) DEFAULT 0.30,
    pct_savings DECIMAL(3, 2) DEFAULT 0.10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUENTAS FÍSICAS (Banco, Efectivo)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL, 
    balance DECIMAL(15, 2) DEFAULT 0.00,
    UNIQUE(user_id, name)
);

-- BOLSAS VIRTUALES (Presupuesto)
CREATE TABLE budget_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    UNIQUE(user_id, category)
);

-- PROVEEDORES
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    payment_condition VARCHAR(20), -- 'Contado', 'Crédito'
    credit_days INTEGER DEFAULT 0
);

-- CIERRES DIARIOS
CREATE TABLE daily_closures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(15, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE
);

-- DETALLE DE INGRESO (Hacia cuentas físicas)
CREATE TABLE daily_closure_details (
    id SERIAL PRIMARY KEY,
    closure_id INTEGER REFERENCES daily_closures(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL
);

-- ASIGNACIÓN DE PRESUPUESTO (Hacia bolsas virtuales)
CREATE TABLE budget_allocation (
    id SERIAL PRIMARY KEY,
    closure_id INTEGER REFERENCES daily_closures(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    amount_allocated DECIMAL(15, 2) NOT NULL
);

-- EGRESOS
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES providers(id),
    account_id INTEGER REFERENCES accounts(id), 
    budget_category VARCHAR(50), 
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pagado',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ##########################################
-- TRIGGERS DE AUTOMATIZACIÓN
-- ##########################################

-- 1. Actualizar SALDO FÍSICO cuando entra dinero
CREATE OR REPLACE FUNCTION update_physical_balance() RETURNS TRIGGER AS $$
BEGIN
    UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_physical_balance
AFTER INSERT ON daily_closure_details
FOR EACH ROW EXECUTE FUNCTION update_physical_balance();

-- 2. Actualizar BOLSA VIRTUAL cuando se asigna presupuesto
CREATE OR REPLACE FUNCTION update_virtual_balance() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO budget_balances (user_id, category, balance)
    VALUES (NEW.user_id, NEW.category, NEW.amount_allocated)
    ON CONFLICT (user_id, category) 
    DO UPDATE SET balance = budget_balances.balance + EXCLUDED.balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_virtual_balance
AFTER INSERT ON budget_allocation
FOR EACH ROW EXECUTE FUNCTION update_virtual_balance();

-- 3. Restar de ambos cuando hay un GASTO PAGADO
CREATE OR REPLACE FUNCTION update_balances_on_expense() RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'Pagado') THEN
        -- Restar de cuenta física
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        -- Restar de bolsa virtual
        UPDATE budget_balances SET balance = balance - NEW.amount 
        WHERE user_id = NEW.user_id AND category = NEW.budget_category;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_made
AFTER INSERT OR UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_balances_on_expense();