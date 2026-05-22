const prisma = require('../config/db')

const getBalances = async (user_id) => {
    return prisma.account.findMany({
        where: {
            user_id: user_id
        },
        select: {
            id: true,
            name: true,
            balance: true
        }
    })
}

const getBudgetBalances = async (user_id) => {
    return prisma.budgetBalance.findMany({
        where: { user_id },
        select: { category: true, balance: true }
    })
}

module.exports = {
    getBalances,
    getBudgetBalances
}

