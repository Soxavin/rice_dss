import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Returns an axios instance pre-configured with the backend JWT.
 * Call this inside async functions where getBackendToken() is available.
 */
export function createAdminClient(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Convenience: build client and make a single call.
 * Usage: adminRequest(getBackendToken, 'get', '/admin/users')
 */
export async function adminRequest(getBackendToken, method, url, data = undefined) {
  const token = await getBackendToken()
  if (!token) throw new Error('Not authenticated')
  const client = createAdminClient(token)
  return client[method](url, data)
}
