/*
  Warnings:

  - The `status` column on the `Expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `AttendanceLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('Pendiente', 'Pagado');

-- AlterTable
ALTER TABLE "AttendanceLog" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "status",
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'Pendiente';

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_deleted_at_idx" ON "Expense"("deleted_at");
