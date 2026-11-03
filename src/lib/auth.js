import { reactive, computed } from 'vue'
import { api, getToken, setToken, clearToken } from '../lib/api.js'

const state = reactive({
  user: null,
  loading: false,
  ready: false,
})

export const useAuth = () => {
  const isAuthenticated = computed(() => !!state.user)

  const role = computed(() => state.user?.role ?? null)

  /** Daftar modul yang boleh diakses user ini (dari backend) */
  const permissions = computed(() => state.user?.permissions ?? [])

  /** Apakah user boleh membuka modul tertentu */
  const can = (module) => permissions.value.includes(module)

  /** Apakah user punya salah satu role yang disebut */
  const is = (...roles) => roles.includes(role.value)

  /** Apakah user adalah dokter yang datanya dibatasi */
  const isScopedDoctor = computed(() => role.value === 'doctor' && !!state.user?.doctorId)

  async function login(email, password) {
    state.loading = true
    try {
      const res = await api.post('/auth/login', { email, password })
      setToken(res.token)
      state.user = res.user
      return res.user
    } finally {
      state.loading = false
    }
  }

  function logout() {
    clearToken()
    state.user = null
  }

  /** Perbarui data user di memori tanpa login ulang */
  function setUser(user) {
    state.user = user
  }

  /** Dipanggil sekali saat app boot */
  async function bootstrap() {
    if (state.ready) return
    if (!getToken()) {
      state.ready = true
      return
    }
    try {
      const res = await api.get('/auth/me')
      state.user = res.user
    } catch {
      clearToken()
      state.user = null
    } finally {
      state.ready = true
    }
  }

  return {
    state,
    isAuthenticated,
    role,
    permissions,
    can,
    is,
    isScopedDoctor,
    login,
    logout,
    setUser,
    bootstrap,
  }
}

/** Label role untuk ditampilkan */
export const roleLabel = (r) =>
  ({ admin: 'Clinic Admin', doctor: 'Dokter', staff: 'Resepsionis' })[r] ?? 'Staff'
