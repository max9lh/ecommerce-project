import { useState, useEffect, useCallback, useMemo } from "react"
import api from "@/api/api"

/**
 * Hook para el formulario de cierre de caja.
 *
 * 1. Carga las cuentas del ADMIN (GET /api/accounts)
 * 2. Maneja el estado del formulario (total + montos por cuenta)
 * 3. Valida en tiempo real que la suma de los detalles coincida con el total
 * 4. Envía el cierre al backend (POST /api/closures)
 */
export function useClosure(closureId) {
  const [accounts, setAccounts] = useState([])

  // Mapa { accountId: monto } — un input por cada cuenta
  const [amounts, setAmounts] = useState({})
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const accountsRes = await api.get("/accounts")
        const accountsData = accountsRes.data.data ?? []
        setAccounts(accountsData)

        const initialAmounts = {}
        accountsData.forEach((acc) => {
          initialAmounts[acc.id] = 0
        })

        if (closureId) {
          const closureRes = await api.get(`/closures/${closureId}`)
          const closureData = closureRes.data.data
          if (closureData) {
            setTotalAmount(Number(closureData.total_amount))
            closureData.details.forEach((detail) => {
              initialAmounts[detail.account_id] = Number(detail.amount)
            })
          }
        }
        setAmounts(initialAmounts)
      } catch (err) {
        setError(err.response?.data?.message || "Error al inicializar los datos")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [closureId])

  // --- Helpers ---

  // Actualizar el monto de una cuenta específica
  const setAmount = useCallback((accountId, value) => {
    setAmounts((prev) => ({
      ...prev,
      [accountId]: Number(value) || 0,
    }))
  }, [])

  // Suma de todos los montos por cuenta
  const detailsSum = useMemo(
    () => Object.values(amounts).reduce((sum, val) => sum + val, 0),
    [amounts]
  )

  // Validación: total > 0 y la suma coincide con el total
  const isValid = useMemo(
    () => totalAmount > 0 && Math.abs(detailsSum - totalAmount) < 0.01,
    [totalAmount, detailsSum]
  )

  const submit = useCallback(async () => {
    if (!isValid) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Armar el body que espera el backend
      const details = Object.entries(amounts)
        .filter(([, amount]) => amount > 0)
        .map(([accountId, amount]) => ({
          account_id: Number(accountId),
          amount,
        }))

      if (closureId) {
        await api.put(`/closures/${closureId}`, {
          total_amount: totalAmount,
          details,
        })
      } else {
        await api.post("/closures", {
          total_amount: totalAmount,
          details,
        })
      }

      setSuccess(true)
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        (closureId ? "Error al modificar el cierre de caja" : "Error al registrar el cierre de caja")
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [isValid, amounts, totalAmount, closureId])

  const reset = useCallback(() => {
    setTotalAmount(0)
    const cleared = {}
    accounts.forEach((acc) => {
      cleared[acc.id] = 0
    })
    setAmounts(cleared)
    setError(null)
    setSuccess(false)
  }, [accounts])

  return {
    accounts,
    amounts,
    totalAmount,
    detailsSum,
    isValid,
    loading,
    submitting,
    error,
    success,
    setAmount,
    setTotalAmount,
    submit,
    reset,
  }
}
