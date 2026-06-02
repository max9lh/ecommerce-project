/**
 * Decodifica el payload de un JWT sin dependencias externas.
 * JWT = header.payload.signature (cada parte en Base64URL).
 * Solo necesitamos la segunda parte (payload).
 *
 * @param {string} token — JWT completo
 * @returns {object|null} — Payload decodificado o null si es inválido
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Verifica si un JWT está expirado.
 * @param {object} payload — Payload decodificado del JWT
 * @returns {boolean} — true si el token expiró
 */
export function isTokenExpired(payload) {
  if (!payload || !payload.exp) return true
  return payload.exp < Date.now() / 1000
}
