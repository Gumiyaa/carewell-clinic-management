<template>
  <!-- Mobile backdrop -->
  <div
    v-if="ui.sidebarOpen"
    class="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] lg:hidden"
    @click="closeSidebar"
  />

  <aside
    class="w-[248px] shrink-0 h-screen bg-sidebar text-white flex flex-col z-50
           fixed inset-y-0 left-0 transition-transform duration-200
           lg:sticky lg:top-0 lg:translate-x-0"
    :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Brand -->
    <div class="px-5 pt-6 pb-6 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-accent grid place-items-center shrink-0">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[17px] font-semibold leading-tight tracking-tight">Carewell</p>
        <p class="text-[11px] text-[#8DA0BC] mt-0.5">Clinic Management</p>
      </div>
      <button class="lg:hidden p-1.5 rounded-lg text-[#8DA0BC] hover:text-white hover:bg-white/10" @click="closeSidebar">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
      <p class="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7F9E]">Menu</p>

      <router-link
        v-for="item in visibleMenu"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
        active-class="!bg-accent !text-white shadow-[0_4px_12px_rgba(24,140,133,0.35)]"
        @click="closeSidebar"
      >
        <component :is="item.icon" class="w-[18px] h-[18px] shrink-0 opacity-90" />
        <span class="truncate">{{ item.label }}</span>
      </router-link>

      <div class="!mt-6 pt-4 border-t border-white/10 space-y-1">
        <p class="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7F9E]">General</p>
        <button
          v-for="item in footerMenu"
          :key="item.label"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          @click="onFooter(item.label)"
        >
          <component :is="item.icon" class="w-[18px] h-[18px] shrink-0 opacity-90" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Help card -->
    <div class="p-3">
      <div class="rounded-xl bg-gradient-to-br from-accent to-accent-dark p-4">
        <p class="text-[13px] font-semibold">Butuh bantuan?</p>
        <p class="text-[11px] text-white/75 mt-1 leading-relaxed">Lihat panduan atau hubungi tim support.</p>
        <button
          class="mt-3 w-full rounded-lg bg-white/15 hover:bg-white/25 transition-colors py-2 text-[12px] font-semibold"
          @click="onFooter('Help & Support')"
        >
          Hubungi Support
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ui, closeSidebar } from '../lib/ui.js'
import { useToast } from '../lib/toast.js'
import { useAuth } from '../lib/auth.js'

const router = useRouter()
const toast = useToast()
const { can } = useAuth()

// Tiny inline icon factory (no icon lib dependency)
const icon = (paths) =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    paths.map((d) => h('path', { d }))
  )

const menu = [
  { to: '/dashboard', label: 'Dashboard', module: 'dashboard', icon: icon(['M3 12h7V3H3v9Z', 'M14 21h7v-9h-7v9Z', 'M14 3v5h7V3h-7Z', 'M3 21h7v-5H3v5Z']) },
  { to: '/patients', label: 'Patients', module: 'patients', icon: icon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87']) },
  { to: '/appointments', label: 'Appointments', module: 'appointments', icon: icon(['M8 2v4M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z']) },
  { to: '/doctors', label: 'Doctors', module: 'doctors', icon: icon(['M8 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M19 8h3M20.5 6.5v3']) },
  { to: '/departments', label: 'Departments', module: 'departments', icon: icon(['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-5h6v5']) },
  { to: '/records', label: 'Medical Records', module: 'records', icon: icon(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z', 'M14 2v6h6', 'M9 13h6M9 17h4']) },
  { to: '/billing', label: 'Billing & Payments', module: 'billing', icon: icon(['M2 7h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z', 'M2 7V5a2 2 0 0 1 2-2h14', 'M16 13h2']) },
  { to: '/reports', label: 'Reports', module: 'reports', icon: icon(['M3 3v18h18', 'M7 15l3-4 3 3 4-6']) },
  { to: '/users', label: 'Users', module: 'users', icon: icon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M20 8v6M23 11h-6']) },
]

/** Hanya tampilkan menu yang role-nya diizinkan */
const visibleMenu = computed(() => menu.filter((m) => can(m.module)))

const footerMenu = [
  { label: 'Pengaturan', icon: icon(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z']) },
  { label: 'Bantuan', icon: icon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01']) },
  { label: 'Profil', icon: icon(['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z']) },
]

function onFooter(label) {
  closeSidebar()
  if (label === 'Bantuan') {
    toast.info('Hubungi support di support@carewell.test')
    return
  }
  if (label === 'Profil') {
    router.push('/profile')
    return
  }
  if (label === 'Pengaturan') {
    router.push('/profile')
    return
  }
  toast.info(`Menu ${label} belum tersedia.`)
}
</script>
