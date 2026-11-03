import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../lib/api.js'
import { useAuth } from '../lib/auth.js'

/**
 * meta.module = modul izin yang dibutuhkan (lihat server/permissions.js)
 * Halaman tanpa meta.module bisa diakses semua user yang sudah login.
 */
const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: () => import('../components/pages/Login.vue'),
    meta: { public: true, title: 'Login' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../components/Dashboard.vue'),
    meta: { title: 'Dashboard', module: 'dashboard' },
  },
  {
    path: '/patients',
    name: 'patients',
    component: () => import('../components/pages/Patients.vue'),
    meta: { title: 'Patients', module: 'patients' },
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('../components/pages/Appointments.vue'),
    meta: { title: 'Appointments', module: 'appointments' },
  },
  {
    path: '/doctors',
    name: 'doctors',
    component: () => import('../components/pages/Doctors.vue'),
    meta: { title: 'Doctors', module: 'doctors' },
  },
  {
    path: '/departments',
    name: 'departments',
    component: () => import('../components/pages/Departments.vue'),
    meta: { title: 'Departments', module: 'departments' },
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('../components/pages/MedicalRecords.vue'),
    meta: { title: 'Medical Records', module: 'records' },
  },
  {
    path: '/billing',
    name: 'billing',
    component: () => import('../components/pages/Billing.vue'),
    meta: { title: 'Billing & Payments', module: 'billing' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('../components/pages/Reports.vue'),
    meta: { title: 'Reports', module: 'reports' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../components/pages/Users.vue'),
    meta: { title: 'Users', module: 'users' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../components/pages/Profile.vue'),
    meta: { title: 'Profil Saya' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('../components/pages/Forbidden.vue'),
    meta: { title: 'Akses Ditolak' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const loggedIn = !!getToken()

  if (!to.meta.public && !loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && loggedIn) {
    return { name: 'dashboard' }
  }

  // Cek izin modul (butuh user sudah ter-load)
  if (to.meta.module) {
    const { state, can, bootstrap } = useAuth()
    if (!state.user) await bootstrap()
    if (!state.user) return { name: 'login', query: { redirect: to.fullPath } }
    if (!can(to.meta.module)) return { name: 'forbidden', query: { from: to.fullPath } }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — Carewell` : 'Carewell'
})

export default router
