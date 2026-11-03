<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader
      :title="isDoctor ? 'Dashboard Dokter' : 'Dashboard'"
      :subtitle="isDoctor ? `Selamat datang, ${user?.name || 'Dokter'}. Ini ringkasan praktik Anda hari ini.` : 'Ringkasan aktivitas klinik hari ini.'"
    >
      <template #actions>
        <BaseButton variant="secondary" @click="load">Refresh</BaseButton>
        <BaseButton @click="$router.push('/appointments')">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Appointment Baru
        </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" />

    <template v-else>
      <!-- Stats: dokter dapat metrik miliknya sendiri -->
      <div v-if="isDoctor" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Pasien Saya"
          :value="fmt(stats.myPatients)"
          hint="total pasien ditangani"
          :icon="icons.users"
        />
        <StatCard
          label="Jadwal Hari Ini"
          :value="fmt(stats.todayAppointments)"
          :hint="`${stats.completedToday} selesai`"
          tone="info"
          :icon="icons.calendar"
        />
        <StatCard
          label="Rekam Medis"
          :value="fmt(stats.totalRecords)"
          hint="total rekam medis saya"
          tone="success"
          :icon="icons.file"
        />
        <StatCard
          label="Belum Selesai"
          :value="fmt(stats.pendingRecords)"
          hint="rekam medis menunggu"
          tone="warning"
          :icon="icons.clock"
        />
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Total Pasien Aktif"
          :value="fmt(stats.totalPatients)"
          hint="terdaftar di sistem"
          :icon="icons.users"
        />
        <StatCard
          label="Appointment Hari Ini"
          :value="fmt(stats.todayAppointments)"
          :hint="`${stats.completedToday} selesai`"
          tone="info"
          :icon="icons.calendar"
        />
        <StatCard
          label="Dokter Aktif"
          :value="fmt(stats.totalDoctors)"
          hint="siap melayani"
          tone="success"
          :icon="icons.stethoscope"
        />
        <StatCard
          v-if="can('billing')"
          label="Pendapatan Bulan Ini"
          :value="compactRupiah(stats.revenueThisMonth)"
          :hint="`${compactRupiah(stats.pendingRevenue)} tertunda`"
          tone="warning"
          :icon="icons.wallet"
        />
        <StatCard
          v-else
          label="Rekam Medis"
          :value="fmt(stats.totalRecords ?? 0)"
          hint="total rekaman"
          tone="warning"
          :icon="icons.file"
        />
      </div>

      <!-- Chart + metrics -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <Card class="xl:col-span-2" title="Tren Appointment" subtitle="7 hari terakhir" body-class="p-5 pt-4">
          <template #actions>
            <span class="text-[11px] text-gray-500">{{ totalWeek }} appointment</span>
          </template>

          <div class="relative h-[240px] flex items-end gap-2 sm:gap-3">
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div v-for="i in 5" :key="i" class="border-t border-dashed border-[#EEF2F7]" />
            </div>
            <div v-for="(d, i) in chart" :key="d.label" class="relative flex-1 flex flex-col justify-end items-center group h-full">
              <div class="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-semibold rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {{ d.value }}
              </div>
              <div
                class="w-full rounded-t-md transition-all duration-300 min-h-[2px]"
                :class="i === chart.length - 1 ? 'bg-accent' : 'bg-[#CBE7E5] group-hover:bg-accent/60'"
                :style="{ height: (d.value / maxValue) * 100 + '%' }"
              />
            </div>
          </div>
          <div class="flex gap-2 sm:gap-3 mt-3">
            <div v-for="d in chart" :key="d.label" class="flex-1 text-center text-[11px] font-medium text-gray-400">
              {{ d.label }}
            </div>
          </div>
        </Card>

        <Card title="Status Appointment" subtitle="Distribusi keseluruhan" body-class="p-4">
          <div class="space-y-2.5">
            <div v-for="s in statusList" :key="s.key" class="flex items-center justify-between rounded-lg px-3 py-2.5" :class="s.bg">
              <div class="min-w-0 flex-1">
                <p class="text-[12px] text-gray-600 truncate">{{ s.label }}</p>
                <div class="h-1.5 w-full bg-white/70 rounded-full mt-2 overflow-hidden">
                  <div class="h-full rounded-full transition-all" :class="s.bar" :style="{ width: s.pct + '%' }" />
                </div>
              </div>
              <span class="text-[15px] font-bold ml-3 shrink-0" :class="s.text">{{ s.total }}</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- Bottom -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card class="xl:col-span-2" title="Appointment Hari Ini" :subtitle="`${todayAppointments.length} jadwal`" body-class="p-0">
          <template #actions>
            <router-link to="/appointments" class="text-[12px] font-semibold text-accent hover:underline">
              Lihat semua
            </router-link>
          </template>

          <ul v-if="todayAppointments.length" class="divide-y divide-[#F1F5F9]">
            <li
              v-for="a in todayAppointments"
              :key="a.id"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-light/60 transition-colors"
            >
              <div class="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold shrink-0" :class="avatarClass(a.patient_name)">
                {{ initials(a.patient_name) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-gray-900 truncate">{{ a.patient_name }}</p>
                <p class="text-[11px] text-gray-500 truncate">
                  {{ a.doctor_name }}<span v-if="a.department_name"> · {{ a.department_name }}</span>
                </p>
              </div>
              <div class="text-right shrink-0 hidden sm:block">
                <p class="text-[12px] font-semibold text-gray-700">{{ formatTime(a.scheduled_at) }}</p>
                <p class="text-[11px] text-gray-400">{{ a.duration_min }} mnt</p>
              </div>
              <Badge :label="apptStatus(a.status).label" :tone="apptStatus(a.status).tone" class="shrink-0" />
            </li>
          </ul>
          <EmptyState v-else title="Tidak ada appointment hari ini" description="Jadwal baru akan muncul di sini." />
        </Card>

        <div class="space-y-4">
          <Card title="Departemen Teratas" body-class="p-4">
            <div v-if="topDepartments.length" class="space-y-3.5">
              <div v-for="d in topDepartments" :key="d.name">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[12px] font-medium text-gray-700">{{ d.name }}</span>
                  <span class="text-[11px] font-semibold text-gray-500">{{ d.total }}</span>
                </div>
                <div class="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-accent" :style="{ width: (d.total / maxDept) * 100 + '%' }" />
                </div>
              </div>
            </div>
            <p v-else class="text-[12px] text-gray-500 py-4 text-center">Belum ada data.</p>
          </Card>

          <div class="rounded-xl p-5 bg-gradient-to-br from-accent to-accent-dark text-white">
            <p class="text-[14px] font-semibold">Aksi Cepat</p>
            <div class="mt-3 space-y-1.5">
              <button
                v-for="q in quickActions"
                :key="q.label"
                class="w-full text-left rounded-lg px-3 py-2 text-[12.5px] font-medium bg-white/10 hover:bg-white/20 transition-colors"
                @click="$router.push(q.to)"
              >
                {{ q.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import PageHeader from './ui/PageHeader.vue'
import BaseButton from './ui/BaseButton.vue'
import StatCard from './ui/StatCard.vue'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import LoadingState from './ui/LoadingState.vue'
import EmptyState from './ui/EmptyState.vue'
import { api } from '../lib/api.js'
import { useToast } from '../lib/toast.js'
import { useAuth } from '../lib/auth.js'
import {
  compactRupiah,
  formatTime,
  initials,
  avatarClass,
  apptStatus,
  toISODate,
} from '../lib/format.js'

const toast = useToast()
const { state, can, is, isScopedDoctor } = useAuth()
const user = computed(() => state.user)
const isDoctor = isScopedDoctor

const loading = ref(true)

const stats = ref({
  totalPatients: 0,
  totalDoctors: 0,
  todayAppointments: 0,
  completedToday: 0,
  revenueThisMonth: 0,
  pendingRevenue: 0,
  myPatients: 0,
  pendingRecords: 0,
  totalRecords: 0,
})
const trend = ref([])
const topDepartments = ref([])
const todayAppointments = ref([])
const statusDistribution = ref([])

const fmt = (n) => Number(n || 0).toLocaleString('id-ID')

const icon = (paths) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    paths.map((p) => h('path', { d: p })))

const icons = {
  users: icon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87']),
  calendar: icon(['M8 2v4M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z']),
  stethoscope: icon(['M6 3v6a4 4 0 0 0 8 0V3', 'M10 13v3a5 5 0 0 0 10 0v-2', 'M20 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z']),
  wallet: icon(['M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z', 'M3 7V5a2 2 0 0 1 2-2h12', 'M17 14h.01']),
  file: icon(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z', 'M14 2v6h6', 'M9 13h6M9 17h4']),
  clock: icon(['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2']),
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/** Isi 7 hari terakhir, termasuk hari kosong */
const chart = computed(() => {
  const map = new Map(trend.value.map((t) => [String(t.d).slice(0, 10), Number(t.total)]))
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toISODate(d)
    out.push({ label: DAY_LABELS[d.getDay()], value: map.get(key) ?? 0 })
  }
  return out
})

const maxValue = computed(() => Math.max(1, ...chart.value.map((c) => c.value)))
const totalWeek = computed(() => chart.value.reduce((s, c) => s + c.value, 0))
const maxDept = computed(() => Math.max(1, ...topDepartments.value.map((d) => Number(d.total))))

const STATUS_META = {
  scheduled: { label: 'Terjadwal', bg: 'bg-sky-50', bar: 'bg-sky-500', text: 'text-sky-700' },
  completed: { label: 'Selesai', bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-700' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-rose-50', bar: 'bg-rose-500', text: 'text-rose-700' },
  no_show: { label: 'Tidak Hadir', bg: 'bg-slate-100', bar: 'bg-slate-400', text: 'text-slate-700' },
}

const statusList = computed(() => {
  const total = statusDistribution.value.reduce((s, x) => s + Number(x.total), 0) || 1
  return statusDistribution.value.map((s) => {
    const meta = STATUS_META[s.status] ?? { label: s.status, bg: 'bg-gray-50', bar: 'bg-gray-400', text: 'text-gray-700' }
    return { key: s.status, ...meta, total: Number(s.total), pct: Math.round((Number(s.total) / total) * 100) }
  })
})

const quickActions = computed(() =>
  [
    { label: '+ Appointment Baru', to: '/appointments', module: 'appointments', allow: ['admin', 'staff', 'doctor'] },
    { label: '+ Daftarkan Pasien', to: '/patients', module: 'patients', allow: ['admin', 'staff'] },
    { label: 'Buat Invoice', to: '/billing', module: 'billing', allow: ['admin', 'staff'] },
    { label: 'Generate Laporan', to: '/reports', module: 'reports', allow: ['admin'] },
  ].filter((q) => can(q.module) && is(...q.allow))
)

async function load() {
  loading.value = true
  try {
    const d = await api.get('/dashboard')
    stats.value = d.stats
    trend.value = d.trend
    topDepartments.value = d.topDepartments
    todayAppointments.value = d.todayAppointments
    statusDistribution.value = d.statusDistribution
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
