/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "refresh_token_hash" TEXT;

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
CREATE INDEX "PasswordResetToken_token_hash_idx" ON "PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_user_id_idx" ON "PasswordResetToken"("user_id");

-- CreateIndex
CREATE INDEX "Account_user_id_idx" ON "Account"("user_id");

-- CreateIndex
CREATE INDEX "AttendanceLog_employee_id_idx" ON "AttendanceLog"("employee_id");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_created_at_idx" ON "AuditLog"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "BudgetAllocation_closure_id_idx" ON "BudgetAllocation"("closure_id");

-- CreateIndex
CREATE INDEX "BudgetAllocation_user_id_idx" ON "BudgetAllocation"("user_id");

-- CreateIndex
CREATE INDEX "DailyClosure_user_id_idx" ON "DailyClosure"("user_id");

-- CreateIndex
CREATE INDEX "DailyClosure_date_idx" ON "DailyClosure"("date");

-- CreateIndex
CREATE INDEX "DailyClosureDetail_closure_id_idx" ON "DailyClosureDetail"("closure_id");

-- CreateIndex
CREATE INDEX "DailyClosureDetail_account_id_idx" ON "DailyClosureDetail"("account_id");

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
CREATE INDEX "Provider_user_id_idx" ON "Provider"("user_id");

-- CreateIndex
CREATE INDEX "RecurringExpense_user_id_idx" ON "RecurringExpense"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deleted_at_idx" ON "User"("deleted_at");

-- CreateIndex
CREATE INDEX "User_refresh_token_hash_idx" ON "User"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
