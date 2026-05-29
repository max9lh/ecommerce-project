import { useState, useEffect, useCallback } from "react"
import api from "@/api/api"

/**
 * Hook para obtener todos los datos de reportes financieros.
 * Maneja filtros de período y fetching paralelo de 6 endpoints.
 */
export function useReports(from, to) {
  const [summary, setSummary] = useState(null)
  const [cashFlow, setCashFlow] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [expensesByProvider, setExpensesByProvider] = useState([])
  const [payroll, setPayroll] = useState({ employees: [], grandTotal: 0, totalHours: 0 })
  const [budgetHealth, setBudgetHealth] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    try {
      const params = `from=${from}&to=${to}`
      const [
        summaryRes,
        cashFlowRes,
        byCategoryRes,
        byProviderRes,
        payrollRes,
        healthRes,
      ] = await Promise.all([
        api.get(`/reports/summary?${params}`),
        api.get(`/reports/cashflow?${params}`),
        api.get(`/reports/expenses-by-category?${params}`),
        api.get(`/reports/expenses-by-provider?${params}&limit=10`),
        api.get(`/reports/payroll?${params}`),
        api.get(`/reports/budget-health`),
      ])

      setSummary(summaryRes.data)
      setCashFlow(cashFlowRes.data)
      setExpensesByCategory(byCategoryRes.data)
      setExpensesByProvider(byProviderRes.data)
      setPayroll(payrollRes.data)
      setBudgetHealth(healthRes.data)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar los reportes")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    summary,
    cashFlow,
    expensesByCategory,
    expensesByProvider,
    payroll,
    budgetHealth,
    loading,
    error,
    refetch: fetchAll,
  }
}
