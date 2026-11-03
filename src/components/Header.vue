<template>
  <header class="h-[72px] shrink-0 bg-white border-b border-[#E8EDF2] flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-30">
    <!-- Mobile menu -->
    <button
      class="lg:hidden w-9 h-9 grid place-items-center rounded-lg bg-neutral-light border border-[#E8EDF2] text-gray-600 hover:text-accent shrink-0"
      @click="toggleSidebar"
    >
      <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Search -->
    <div class="relative w-full max-w-[320px]">
      <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        v-model="q"
        type="text"
        placeholder="Cari pasien, dokter..."
        class="w-full h-10 pl-9 pr-3 rounded-lg bg-neutral-light border border-[#E8EDF2] text-[13px] text-gray-700 placeholder-text-muted outline-none focus:border-accent focus:bg-white transition-colors"
        @keyup.enter="goSearch"
      />
    </div>

    <div class="flex-1" />

    <!-- Notifications -->
    <div class="relative">
      <button
        class="relative w-9 h-9 grid place-items-center rounded-lg bg-neutral-light border border-[#E8EDF2] text-gray-500 hover:text-accent hover:border-accent/40 transition-colors"
        @click="notifOpen = !notifOpen"
      >
        <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span v-if="alerts.length" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E05D5D] ring-2 ring-white" />
      </button>

      <transition name="pop">
        <div v-if="notifOpen" class="absolute right-0 top-11 w-[300px] bg-white rounded-xl border border-[#E8EDF2] shadow-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-[#E8EDF2] flex items-center justify-between">
            <p class="text-[13px] font-semibold text-gray-900">Notifikasi</p>
            <span class="text-[11px] text-gray-500">{{ alerts.length }} baru</span>
          </div>
          <ul class="max-h-[280px] overflow-y-auto divide-y divide-[#F1F5F9]">
            <li v-for="(a, i) in alerts" :key="i" class="px-4 py-3 hover:bg-neutral-light/60">
              <p class="text-[12.5px] font-medium text-gray-800">{{ a.title }}</p>
              <p class="text-[11px] text-gray-500 mt-0.5">{{ a.desc }}</p>
            </li>
            <li v-if="!alerts.length" class="px-4 py-6 text-center text-[12px] text-gray-500">
              Tidak ada notifikasi
            </li>
          </ul>
        </div>
      </transition>
    </div>

    <!-- Date -->
    <div class="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-neutral-light border border-[#E8EDF2] text-[13px] text-gray-500">
      <svg class="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 11h18" />
      </svg>
      {{ today }}
    </div>

    <div class="w-px h-8 bg-[#E8EDF2]" />

    <!-- User -->
    <div class="relative">
      <button
        class="flex items-center gap-3 rounded-lg pl-1 pr-2 py-1 hover:bg-neutral-light transition-colors"
        @click="userOpen = !userOpen"
      >
        <div class="w-9 h-9 rounded-full bg-accent text-white grid place-items-center text-[12px] font-semibold shrink-0">
          {{ userInitials }}
        </div>
        <div class="text-left leading-tight hidden sm:block">
          <p class="text-[13px] font-semibold text-gray-900">{{ user?.name || 'Guest' }}</p>
          <p class="text-[11px] text-gray-500">{{ roleLabel }}</p>
        </div>
        <svg class="w-4 h-4 text-text-muted hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <transition name="pop">
        <div v-if="userOpen" class="absolute right-0 top-12 w-[220px] bg-white rounded-xl border border-[#E8EDF2] shadow-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-[#E8EDF2]">
            <p class="text-[13px] font-semibold text-gray-900 truncate">{{ user?.name }}</p>
            <p class="text-[11px] text-gray-500 truncate">{{ user?.email }}</p>
          </div>
          <button class="w-full text-left px-4 py-2.5 text-[12.5px] text-gray-700 hover:bg-neutral-light flex items-center gap-2" @click="goProfile">
            <svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profil saya
          </button>
          <button class="w-full text-left px-4 py-2.5 text-[12.5px] text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-[#F1F5F9]" @click="doLogout">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </transition>
    </div>
  </header>

  <!-- click-away -->
  <div v-if="notifOpen || userOpen" class="fixed inset-0 z-20" @click="notifOpen = userOpen = false" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../lib/auth.js'
import { useToast } from '../lib/toast.js'
import { api } from '../lib/api.js'
import { initials } from '../lib/format.js'
import { toggleSidebar } from '../lib/ui.js'
import { roleLabel as labelFor } from '../lib/auth.js'

const router = useRouter()
const { state, logout, can, isScopedDoctor } = useAuth()
const toast = useToast()

const user = computed(() => state.user)
const userInitials = computed(() => initials(user.value?.name || 'GU'))
const roleLabel = computed(() => labelFor(user.value?.role))

const q = ref('')
const notifOpen = ref(false)
const userOpen = ref(false)
const alerts = ref([])

const today = computed(() =>
  new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
)

function goSearch() {
  if (!q.value.trim()) return
  router.push({ name: 'patients', query: { q: q.value.trim() } })
}

function goProfile() {
  userOpen.value = false
  router.push('/profile')
}

function doLogout() {
  logout()
  userOpen.value = false
  toast.success('Berhasil keluar.')
  router.push('/login')
}

onMounted(async () => {
  try {
    const d = await api.get('/dashboard')
    const s = d.stats
    const list = []

    // Info finansial hanya untuk yang punya akses billing
    if (can('billing') && s.pendingRevenue > 0) {
      list.push({
        title: 'Pembayaran tertunda',
        desc: `${Number(s.pendingRevenue).toLocaleString('id-ID')} rupiah belum dibayar`,
      })
    }

    // Dokter: pengingat rekam medis yang belum selesai
    if (isScopedDoctor.value && s.pendingRecords > 0) {
      list.push({
        title: `${s.pendingRecords} rekam medis belum selesai`,
        desc: 'Perlu dilengkapi hari ini',
      })
    }

    if (s.todayAppointments > 0) {
      list.push({
        title: `${s.todayAppointments} appointment hari ini`,
        desc: `${s.completedToday} sudah selesai`,
      })
    }

    alerts.value = list
  } catch {
    alerts.value = []
  }
})
</script>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
