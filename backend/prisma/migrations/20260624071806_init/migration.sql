-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('Pendiente', 'Pagado');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT,
    "pct_merchandise" DECIMAL(3,2) NOT NULL DEFAULT 0.60,
    "pct_fixed_expenses" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
    "pct_savings" DECIMAL(3,2) NOT NULL DEFAULT 0.10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "refresh_token_hash" TEXT,
    "deleted_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetBalance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "BudgetBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyClosure" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyClosureDetail" (
    "id" SERIAL NOT NULL,
    "closure_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "DailyClosureDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" SERIAL NOT NULL,
    "closure_id" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "amount_allocated" DECIMAL(15,2) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "payment_condition" VARCHAR(20) NOT NULL,
    "credit_days" INTEGER NOT NULL DEFAULT 0,
    "visible_to_employee" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "budget_category" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'Pendiente',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePermission" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "canRegisterClosures" BOOLEAN NOT NULL DEFAULT false,
    "canRegisterExpenses" BOOLEAN NOT NULL DEFAULT false,
    "canPayExpenses" BOOLEAN NOT NULL DEFAULT false,
    "canManageProviders" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmployeePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "salary_type" VARCHAR(20) NOT NULL DEFAULT 'hourly',
    "hourly_rate" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "monthly_salary" DECIMAL(15,2),
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3),
    "hours_worked" DECIMAL(5,2),
    "amount_earned" DECIMAL(15,2),
    "notes" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_day" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'Gastos Fijos',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frequency" VARCHAR(20) NOT NULL DEFAULT 'monthly',

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deleted_at_idx" ON "User"("deleted_at");

-- CreateIndex
CREATE INDEX "User_refresh_token_hash_idx" ON "User"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_user_id_idx" ON "Account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetBalance_user_id_category_key" ON "BudgetBalance"("user_id", "category");

-- CreateIndex
CREATE INDEX "DailyClosure_user_id_idx" ON "DailyClosure"("user_id");

-- CreateIndex
CREATE INDEX "DailyClosure_date_idx" ON "DailyClosure"("date");

-- CreateIndex
CREATE INDEX "DailyClosureDetail_closure_id_idx" ON "DailyClosureDetail"("closure_id");

-- CreateIndex
CREATE INDEX "DailyClosureDetail_account_id_idx" ON "DailyClosureDetail"("account_id");

-- CreateIndex
CREATE INDEX "BudgetAllocation_closure_id_idx" ON "BudgetAllocation"("closure_id");

-- CreateIndex
CREATE INDEX "BudgetAllocation_user_id_idx" ON "BudgetAllocation"("user_id");

-- CreateIndex
CREATE INDEX "Provider_user_id_idx" ON "Provider"("user_id");

-- CreateIndex
CREATE INDEX "Expense_user_id_idx" ON "Expense"("user_id");

-- CreateIndex
CREATE INDEX "Expense_provider_id_idx" ON "Expense"("provider_id");

-- CreateIndex
CREATE INDEX "Expense_account_id_idx" ON "Expense"("account_id");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_due_date_idx" ON "Expense"("due_date");

-- CreateIndex
CREATE INDEX "Expense_deleted_at_idx" ON "Expense"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePermission_user_id_key" ON "EmployeePermission"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_user_id_key" ON "EmployeeProfile"("user_id");

-- CreateIndex
CREATE INDEX "AttendanceLog_employee_id_idx" ON "AttendanceLog"("employee_id");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_created_at_idx" ON "AuditLog"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "RecurringExpense_user_id_idx" ON "RecurringExpense"("user_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_hash_idx" ON "PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_user_id_idx" ON "PasswordResetToken"("user_id");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetBalance" ADD CONSTRAINT "BudgetBalance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosure" ADD CONSTRAINT "DailyClosure_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosureDetail" ADD CONSTRAINT "DailyClosureDetail_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClosureDetail" ADD CONSTRAINT "DailyClosureDetail_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "DailyClosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "DailyClosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePermission" ADD CONSTRAINT "EmployeePermission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
