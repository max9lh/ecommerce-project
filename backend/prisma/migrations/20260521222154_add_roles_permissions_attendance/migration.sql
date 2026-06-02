-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EMPLOYEE';

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

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePermission_user_id_key" ON "EmployeePermission"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_user_id_key" ON "EmployeeProfile"("user_id");

-- AddForeignKey
ALTER TABLE "EmployeePermission" ADD CONSTRAINT "EmployeePermission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
