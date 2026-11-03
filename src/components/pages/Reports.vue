<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader title="Reports" subtitle="Buat dan unduh laporan klinik dari data nyata.">
      <template #actions>
        <select
          v-model="period"
          class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent"
        >
          <option value="this_month">Bulan Ini</option>
          <option value="last_month">Bulan Lalu</option>
          <option value="last_7">7 Hari Terakhir</option>
          <option value="year">Tahun Ini</option>
          <option value="all">Semua Waktu</option>
        </select>
        <BaseButton variant="secondary" @click="exportCsv">Export CSV</BaseButton>
        <BaseButton @click="printReport">Cetak</BaseButton>
      </template>
    </PageHeader>

    <!-- Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      <div v-for="s in overviewCards" :key="s.label" class="bg-white rounded-xl border border-[#E8EDF2] p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[12px] font-medium text-gray-500">{{ s.label }}</p>
            <p class="text-[22px] font-bold mt-1.5 leading-none truncate text-gray-900">{{ s.value }}</p>
          </div>
          <div class="w-9 h-9 rounded-lg grid place-items-center shrink-0" :class="s.iconBg">
            <component :is="s.icon" class="w-4 h-4" :class="s.iconColor" />
          </div>
        </div>
        <p class="text-[11px] text-gray-500 mt-3">{{ s.hint }}</p>
      </div>
    </div>

    <!-- Report type selector -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <button
        v-for="t in templates"
        :key="t.type"
        class="text-left bg-white rounded-xl border p-5 transition-all"
        :class="
          type === t.type
            ? 'border-accent ring-1 ring-accent/30 shadow-[0_4px_16px_rgba(24,140,133,0.10)]'
            : 'border-[#E8EDF2] hover:border-accent/40 hover:shadow-[0_4px_16px_rgba(23,43,77,0.06)]'
        "
        @click="type = t.type"
      >
        <div class="flex items-start justify-between">
          <div class="w-10 h-10 rounded-lg grid place-items-center" :class="t.iconBg">
            <component :is="t.icon" class="w-5 h-5" :class="t.iconColor" />
          </div>
          <span
            v-if="type === t.type"
            class="inline-flex items-center gap-1 rounded-full bg-[#E6F4F3] px-2 py-0.5 text-[10px] font-semibold text-accent"
          >
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
            Aktif
          </span>
        </div>
        <p class="text-[14px] font-semibold text-gray-900 mt-3.5">{{ t.title }}</p>
        <p class="text-[12px] text-gray-500 mt-1 leading-relaxed">{{ t.desc }}</p>
        <p class="text-[11px] font-semibold text-accent mt-3">{{ t.hint }}</p>
      </button>
    </div>

    <!-- Report table -->
    <Card :title="report?.title || 'Laporan'" :subtitle="rangeLabel" body-class="p-0">
      <template #actions>
        <span class="text-[11px] text-gray-500">{{ rows.length }} baris</span>
      </template>

      <LoadingState v-if="loading" text="Menyusun laporan..." />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[820px]">
            <thead>
              <tr class="border-b border-[#E8EDF2] bg-neutral-light/60">
                <th
                  v-for="c in columns"
                  :key="c.key"
                  class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                  :class="{ 'text-right': isNumeric(c.key) }"
                >
                  {{ c.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="(row, i) in rows" :key="i" class="hover:bg-neutral-light/60 transition-colors">
                <td
                  v-for="c in columns"
                  :key="c.key"
                  class="px-5 py-3.5 text-[13px]"
                  :class="cellClass(c.key)"
                >
                  <Badge
                    v-if="c.key === 'status'"
                    :label="statusLabel(row[c.key])"
                    :tone="statusTone(row[c.key])"
                  />
                  <span v-else-if="c.key === 'name' || c.key === 'patient_name'" class="font-semibold text-gray-900">
                    {{ row[c.key] }}
                  </span>
                  <span v-else-if="c.key === 'code'" class="font-semibold text-accent">{{ row[c.key] }}</span>
                  <span v-else-if="c.key === 'gender'">{{ genderLabel(row[c.key]) }}</span>
                  <span v-else-if="isNumeric(c.key)">{{ formatNumber(row[c.key], c.key) }}</span>
                  <span v-else-if="isDate(c.key)">{{ formatDate(row[c.key]) }}</span>
                  <span v-else>{{ row[c.key] ?? '-' }}</span>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td :colspan="columns.length">
                  <EmptyState
                    title="Tidak ada data pada periode ini"
                    description="Coba pilih periode lain atau tipe laporan berbeda."
                  />
                </td>
              </tr>
            </tbody>
            <tfoot v-if="rows.length && totals">
              <tr class="border-t-2 border-[#E8EDF2] bg-neutral-light/50">
                <td :colspan="columns.length" class="px-5 py-3">
                  <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
                    <span class="font-semibold text-gray-700">Ringkasan:</span>
                    <span v-for="t in totalChips" :key="t.label" class="text-gray-600">
                      {{ t.label }} <span class="font-semibold text-gray-900">{{ t.value }}</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'
import PageHeader from '../ui/PageHeader.vue'
import BaseButton from '../ui/BaseButton.vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'
import LoadingState from '../ui/LoadingState.vue'
import EmptyState from '../ui/EmptyState.vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../lib/toast.js'
import { rupiah, compactRupiah, formatDate, invoiceStatus, patientStatus, genderLabel } from '../../lib/format.js'

const toast = useToast()

const icon = (paths) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    paths.map((p) => h('path', { d: p })))

const templates = [
  {
    type: 'patients',
    title: 'Laporan Pasien',
    desc: 'Demografi, jumlah kunjungan, dan status pasien pada periode terpilih.',
    hint: 'Klik untuk memuat →',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    icon: icon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z']),
  },
  {
    type: 'finance',
    title: 'Laporan Keuangan',
    desc: 'Invoice, jumlah dibayar, dan sisa tagihan yang belum lunas.',
    hint: 'Klik untuk memuat →',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: icon(['M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z', 'M3 7V5a2 2 0 0 1 2-2h12', 'M17 14h.01']),
  },
  {
    type: 'doctors',
    title: 'Performa Dokter',
    desc: 'Jumlah appointment, tingkat penyelesaian, dan pendapatan per dokter.',
    hint: 'Klik untuk memuat →',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    icon: icon(['m12 3 2.7 5.6 6.3.9-4.5 4.3 1 6.2L12 17l-5.5 3 1-6.2L3 9.5l6.3-.9L12 3Z']),
  },
]

const period = ref('this_month')
const type = ref('patients')
const loading = ref(true)
const report = ref(null)
const overview = ref(null)

const columns = computed(() => report.value?.columns ?? [])
const rows = computed(() => report.value?.rows ?? [])
const totals = computed(() => report.value?.totals ?? null)

const PERIOD_LABEL = {
  this_month: 'Bulan Ini',
  last_month: 'Bulan Lalu',
  last_7: '7 Hari Terakhir',
  year: 'Tahun Ini',
  all: 'Semua Waktu',
}

const rangeLabel = computed(() => {
  if (!report.value) return PERIOD_LABEL[period.value]
  const { start, end } = report.value.range
  return `${PERIOD_LABEL[period.value]} · ${formatDate(start)} – ${formatDate(end)}`
})

const overviewCards = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    {
      label: 'Total Pasien',
      value: formatNumber(o.totalPatients),
      hint: `${formatNumber(o.activePatients)} pasien aktif`,
      iconBg: 'bg-[#E6F4F3]',
      iconColor: 'text-accent',
      icon: icon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87']),
    },
    {
      label: 'Total Appointment',
      value: formatNumber(o.totalAppointments),
      hint: `${formatNumber(o.totalRecords)} rekam medis`,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      icon: icon(['M8 2v4M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z']),
    },
    {
      label: 'Total Ditagihkan',
      value: compactRupiah(o.totalBilled),
      hint: `${formatNumber(o.totalInvoices)} invoice`,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      icon: icon(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z', 'M14 2v6h6']),
    },
    {
      label: 'Belum Terbayar',
      value: compactRupiah(o.totalOutstanding),
      hint: `${compactRupiah(o.totalPaid)} sudah masuk`,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: icon(['M12 8v5l3 2', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z']),
    },
  ]
})

const totalChips = computed(() => {
  const t = totals.value
  if (!t) return []
  const out = []
  if (t.total !== undefined) out.push({ label: 'Jumlah data', value: formatNumber(t.total) })
  if (t.active !== undefined) out.push({ label: 'Aktif', value: formatNumber(t.active) })
  if (t.male !== undefined) out.push({ label: 'Laki-laki', value: formatNumber(t.male) })
  if (t.female !== undefined) out.push({ label: 'Perempuan', value: formatNumber(t.female) })
  if (t.billed !== undefined) out.push({ label: 'Ditagihkan', value: rupiah(t.billed) })
  if (t.paid !== undefined) out.push({ label: 'Dibayar', value: rupiah(t.paid) })
  if (t.outstanding !== undefined) out.push({ label: 'Sisa', value: rupiah(t.outstanding) })
  if (t.appointments !== undefined) out.push({ label: 'Appointment', value: formatNumber(t.appointments) })
  if (t.revenue !== undefined) out.push({ label: 'Pendapatan', value: rupiah(t.revenue) })
  return out
})

const NUMERIC = ['age', 'visits', 'amount', 'paid_amount', 'outstanding', 'appointments', 'completed', 'patients', 'revenue']
const DATES = ['issue_date', 'record_date', 'due_date']

const isNumeric = (k) => NUMERIC.includes(k)
const isDate = (k) => DATES.includes(k)

const cellClass = (k) => (isNumeric(k) ? 'text-right text-gray-700 font-medium' : 'text-gray-600')

const formatNumber = (v, key) => {
  if (v === null || v === undefined || v === '') return '-'
  if (['amount', 'paid_amount', 'outstanding', 'revenue'].includes(key)) return rupiah(v)
  return Number(v).toLocaleString('id-ID')
}

const statusLabel = (s) => {
  if (['paid', 'pending', 'overdue', 'cancelled'].includes(s)) return invoiceStatus(s).label
  return patientStatus(s).label
}
const statusTone = (s) => {
  if (['paid', 'pending', 'overdue', 'cancelled'].includes(s)) return invoiceStatus(s).tone
  return patientStatus(s).tone
}

async function loadOverview() {
  try {
    overview.value = await api.get('/reports/overview')
  } catch (e) {
    toast.error(e.message)
  }
}

async function loadReport() {
  loading.value = true
  try {
    report.value = await api.get(`/reports?type=${type.value}&period=${period.value}`)
  } catch (e) {
    toast.error(e.message)
    report.value = null
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!report.value || !rows.value.length) {
    toast.error('Tidak ada data untuk diexport.')
    return
  }
  const head = columns.value.map((c) => c.label)
  const body = rows.value.map((r) =>
    columns.value.map((c) => {
      const v = r[c.key]
      return v === null || v === undefined ? '' : String(v)
    })
  )
  const csv = [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.value.type}-${report.value.range.start}-${report.value.range.end}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Laporan diunduh sebagai CSV.')
}

function printReport() {
  if (!rows.value.length) {
    toast.error('Tidak ada data untuk dicetak.')
    return
  }
  window.print()
}

watch([type, period], loadReport)

onMounted(() => {
  loadOverview()
  loadReport()
})
</script>
