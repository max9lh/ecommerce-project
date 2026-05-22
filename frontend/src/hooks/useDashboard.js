import { useState, useEffect } from "react"
import api from "@/api/api"

/**
 * Hook centralizado para todos los datos del Dashboard.
 * Retorna: accounts, budgetBalances, upcomingExpenses, user, loading, error
 */
export function useDashboard() {
  const [accounts, setAccounts] = useState([])
  const [budgetBalances, setBudgetBalances] = useState([])
  const [upcomingExpenses, setUpcomingExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const [accountsRes, budgetRes, upcomingRes] = await Promise.all([
          api.get("/accounts"),
          api.get("/accounts/budget-balances"),
          api.get("/expenses/upcoming"),
        ])
        setAccounts(accountsRes.data.data ?? [])
        setBudgetBalances(budgetRes.data.data ?? [])
        setUpcomingExpenses(upcomingRes.data ?? [])
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar los datos del panel")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  // -- Derivados utiles para los componentes --

  // Suma total de cuentas físicas
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  // Saldo de cada cuenta por nombre
  const getAccountBalance = (name) =>
    Number(accounts.find((a) => a.name?.toLowerCase().includes(name.toLowerCase()))?.balance ?? 0)

  // Saldo de una bolsa de presupuesto por categoría exacta (ej. "Mercadería")
  const getBudgetBalance = (category) =>
    Number(budgetBalances.find((b) => b.category === category)?.balance ?? 0)

  return {
    accounts,
    budgetBalances,
    upcomingExpenses,
    totalBalance,
    getAccountBalance,
    getBudgetBalance,
    loading,
    error,
  }
}
