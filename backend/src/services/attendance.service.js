const prisma = require('../config/db');

const attendanceService = {

    async registerAttendance(employeeId, checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);

        if (end <= start) {
            const error = new Error('La fecha de salida (checkOut) debe ser posterior a la de entrada (checkIn)');
            error.statusCode = 400;
            throw error;
        }

        const overlappingLog = await prisma.attendanceLog.findFirst({
            where: {
                employee_id: employeeId,
                OR: [
                    { check_in: { lte: start }, check_out: { gte: start } },
                    { check_in: { lte: end }, check_out: { gte: end } },
                ]
            }
        });

        if (overlappingLog) {
            const error = new Error('El empleado ya tiene un turno registrado que se superpone con este horario');
            error.statusCode = 400;
            throw error;
        }

        const employee = await prisma.user.findFirst({
            where: { id: employeeId, role: 'EMPLOYEE' },
            include: { employeeProfile: true }
        });

        if (!employee || !employee.employeeProfile) {
            const error = new Error('Empleado no encontrado o no posee un perfil configurado');
            error.statusCode = 404;
            throw error;
        }

        const { salary_type, hourly_rate } = employee.employeeProfile;
        const diffMs = end - start;
        const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

        let amountEarned = 0;
        if (salary_type === 'hourly') {
            if (!hourly_rate) {
                const error = new Error('El empleado es de tipo "hourly" pero no tiene una tarifa asignada');
                error.statusCode = 400;
                throw error;
            }
            amountEarned = parseFloat((hoursWorked * parseFloat(hourly_rate)).toFixed(2));
        } else {
            amountEarned = 0;
        }

        return await prisma.attendanceLog.create({
            data: {
                employee_id: employeeId,
                check_in: start,
                check_out: end,
                hours_worked: hoursWorked,
                amount_earned: amountEarned
            }
        });
    },

    async getAttendanceLogs({ employeeId, from, to }) {
        const where = {};

        if (employeeId) {
            where.employee_id = employeeId;
        }

        if (from || to) {
            where.check_in = {};
            if (from) where.check_in.gte = new Date(from);
            if (to) where.check_in.lte = new Date(to);
        }

        return await prisma.attendanceLog.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        username: true,
                        employeeProfile: true
                    }
                }
            },
            orderBy: { check_in: 'desc' }
        });
    },

    async getSummaryForPeriod(from, to, employeeId = null, txClient = null) {
        const client = txClient || prisma;
        const where = {};

        if (employeeId) where.employee_id = employeeId;
        where.notes = null; // Ignorar los registros que ya fueron liquidados

        if (from || to) {
            where.check_in = {};
            if (from) where.check_in.gte = new Date(from);
            if (to) where.check_in.lte = new Date(to);
        }

        const aggregations = await client.attendanceLog.groupBy({
            by: ['employee_id'],
            where,
            _sum: { hours_worked: true, amount_earned: true }
        });

        return await Promise.all(
            aggregations.map(async (agg) => {
                const user = await client.user.findUnique({
                    where: { id: agg.employee_id },
                    include: { employeeProfile: true }
                });

                const totalHours = agg._sum.hours_worked ? parseFloat(agg._sum.hours_worked.toFixed(2)) : 0;
                let totalToPay = agg._sum.amount_earned ? parseFloat(agg._sum.amount_earned.toFixed(2)) : 0;

                if (user?.employeeProfile?.salary_type === 'fixed') {
                    totalToPay = user.employeeProfile.monthly_salary ? parseFloat(user.employeeProfile.monthly_salary) : 0;
                }

                return {
                    employeeId: agg.employee_id,
                    name: user?.name || 'Desconocido',
                    salaryType: user?.employeeProfile?.salary_type || 'No definido',
                    totalHours,
                    calculatedAmount: totalToPay
                };
            })
        );
    },

    async updateAttendance(id, checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);

        if (end <= start) {
            const error = new Error('La fecha de salida debe ser posterior a la de entrada');
            error.statusCode = 400;
            throw error;
        }

        const log = await prisma.attendanceLog.findUnique({
            where: { id },
            include: { employee: { include: { employeeProfile: true } } }
        });

        if (!log) {
            const error = new Error('Registro de asistencia no encontrado');
            error.statusCode = 404;
            throw error;
        }

        if (log.notes) {
            const error = new Error('No se pueden modificar registros de asistencia que ya han sido liquidados');
            error.statusCode = 403;
            throw error;
        }

        const overlappingLog = await prisma.attendanceLog.findFirst({
            where: {
                employee_id: log.employee_id,
                NOT: { id: id },
                OR: [
                    { check_in: { lte: start }, check_out: { gte: start } },
                    { check_in: { lte: end }, check_out: { gte: end } },
                    { check_in: { gte: start }, check_out: { lte: end } }
                ]
            }
        });

        if (overlappingLog) {
            const error = new Error('El nuevo horario se superpone con otro turno ya existente para este empleado');
            error.statusCode = 400;
            throw error;
        }

        const employeeProfile = log.employee?.employeeProfile || {};
        const salary_type = employeeProfile.salary_type;
        const hourly_rate = employeeProfile.hourly_rate;
        const diffMs = end - start;
        const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

        let amountEarned = 0;
        if (salary_type === 'hourly') {
            amountEarned = parseFloat((hoursWorked * parseFloat(hourly_rate)).toFixed(2));
        }

        return await prisma.attendanceLog.update({
            where: { id },
            data: {
                check_in: start,
                check_out: end,
                hours_worked: hoursWorked,
                amount_earned: amountEarned
            }
        });
    },

    async deleteAttendance(id) {
        const log = await prisma.attendanceLog.findUnique({ where: { id } });
        if (!log) {
            const error = new Error('Registro de asistencia no encontrado');
            error.statusCode = 404;
            throw error;
        }

        if (log.notes) {
            const error = new Error('No se pueden eliminar registros de asistencia que ya han sido liquidados');
            error.statusCode = 403;
            throw error;
        }

        return await prisma.attendanceLog.delete({ where: { id } });
    },

    async processPayrollToExpenses({ employeeId, from, to, providerId, accountId, budgetCategory, adminUserId }) {
        return await prisma.$transaction(async (tx) => {

            const summary = await this.getSummaryForPeriod(from, to, employeeId, tx);
            const employeeData = summary[0];

            if (!employeeData || employeeData.calculatedAmount <= 0) {
                throw new Error('No hay montos salariales válidos para liquidar en este período');
            }

            const payrollExpense = await tx.expense.create({
                data: {
                    user_id: adminUserId,
                    provider_id: providerId,
                    account_id: accountId,
                    amount: employeeData.calculatedAmount,
                    status: 'PENDIENTE',
                    due_date: new Date(),
                    budget_category: budgetCategory || 'Gastos Fijos'
                }
            });

            await tx.attendanceLog.updateMany({
                where: {
                    employee_id: employeeId,
                    check_in: { gte: new Date(from), lte: new Date(to) },
                    notes: null
                },
                data: {
                    notes: `Liquidado automáticamente en Egreso ID: ${payrollExpense.id}`
                }
            });

            return payrollExpense;
        });
    }
};

module.exports = attendanceService;