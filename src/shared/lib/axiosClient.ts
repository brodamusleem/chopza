import axios from 'axios'
import { supabase } from './supabaseClient'

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim()
export const axiosClient = axios.create({ baseURL, timeout: 15000 })
axiosClient.interceptors.request.use(async (config) => {
  // Do not leak a user's access token to arbitrary absolute URLs or third-party APIs.
  if (baseURL && supabase) {
    const trusted = new URL(baseURL, window.location.origin)
    const target = new URL(axiosClient.getUri(config), window.location.origin)
    if (trusted.origin === target.origin) {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      if (data.session)
        config.headers.set(
          'Authorization',
          `Bearer ${data.session.access_token}`,
        )
    }
  }
  return config
})
axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Preserve Axios status/response details for feature-specific handling.
    return Promise.reject(
      error instanceof Error ? error : new Error('The request failed.'),
    )
  },
)
