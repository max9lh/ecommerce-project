-- ============================================================
-- Gestor Financiero - Triggers de Automatización
-- ============================================================
-- NOTA: Las tablas son creadas por Prisma Migrate.
-- Este archivo solo contiene triggers y funciones que Prisma
-- no soporta de forma nativa.
--
-- Se ejecuta automáticamente al inicializar el contenedor de
-- PostgreSQL (docker-entrypoint-initdb.d).
--
-- IMPORTANTE: Este archivo SOLO se ejecuta la primera vez que
-- se crea el volumen de la DB. Si necesitas re-ejecutarlo,
-- eliminar el volumen: docker volume rm ecommerce-project_db_data
-- ============================================================

-- 1. Actualizar SALDO FÍSICO cuando entra dinero (cierre de caja)
CREATE OR REPLACE FUNCTION update_physical_balance() RETURNS TRIGGER AS $$
BEGIN
    UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Solo crear el trigger si la tabla existe (Prisma la crea con migrate)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_closure_details') THEN
        DROP TRIGGER IF EXISTS trg_update_physical_balance ON daily_closure_details;
        CREATE TRIGGER trg_update_physical_balance
        AFTER INSERT ON daily_closure_details
        FOR EACH ROW EXECUTE FUNCTION update_physical_balance();
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_allocation') THEN
        DROP TRIGGER IF EXISTS trg_update_virtual_balance ON budget_allocation;
        CREATE TRIGGER trg_update_virtual_balance
        AFTER INSERT ON budget_allocation
        FOR EACH ROW EXECUTE FUNCTION update_virtual_balance();
    END IF;
END $$;

-- 3. Restar de ambos saldos cuando hay un GASTO PAGADO
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        DROP TRIGGER IF EXISTS trg_expense_made ON expenses;
        CREATE TRIGGER trg_expense_made
        AFTER INSERT OR UPDATE ON expenses
        FOR EACH ROW EXECUTE FUNCTION update_balances_on_expense();
    END IF;
END $$;