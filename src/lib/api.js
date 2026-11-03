const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const TOKEN_KEY = 'carewell_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend berjalan.', 0)
  }

  // 401 pada /auth/login = kredensial salah (bukan sesi habis)
  const isLoginAttempt = path.startsWith('/auth/login')

  if (res.status === 401 && !isLoginAttempt) {
    clearToken()
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login'
    }
    throw new ApiError('Sesi berakhir. Silakan login kembali.', 401)
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Permintaan gagal (${res.status})`, res.status)
  }
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
}
