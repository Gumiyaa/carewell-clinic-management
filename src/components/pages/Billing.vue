<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader title="Billing & Payments" subtitle="Invoice dan pelacakan pembayaran.">
      <template #actions>
        <BaseButton @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Buat Invoice
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <div v-for="s in summary" :key="s.label" class="bg-white rounded-xl border border-[#E8EDF2] p-5">
        <div class="flex items-start justify-between">
          <div class="min-w-0">
            <p class="text-[12px] font-medium text-gray-500">{{ s.label }}</p>
            <p class="text-[22px] font-bold mt-1.5 leading-none truncate" :class="s.text">{{ s.value }}</p>
          </div>
          <div class="w-9 h-9 rounded-lg grid place-items-center shrink-0" :class="s.iconBg">
            <component :is="s.icon" class="w-4 h-4" :class="s.iconColor" />
          </div>
        </div>
        <p class="text-[11px] text-gray-500 mt-3">{{ s.hint }}</p>
      </div>
    </div>

    <Card title="Daftar Invoice" :subtitle="`${filtered.length} invoice`" body-class="p-0">
      <template #actions>
        <div class="flex items-center gap-2">
          <SearchInput v-model="search" placeholder="Cari invoice / pasien..." class="w-[220px]" />
          <select v-model="statusFilter" class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent">
            <option value="">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="pending">Menunggu</option>
            <option value="overdue">Jatuh Tempo</option>
          </select>
        </div>
      </template>

      <LoadingState v-if="loading" />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[880px]">
            <thead>
              <tr class="border-b border-[#E8EDF2] bg-neutral-light/60">
                <th v-for="h in headers" :key="h" class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="i in filtered" :key="i.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5 text-[13px] font-semibold text-accent">{{ i.code }}</td>
                <td class="px-5 py-3.5">
                  <p class="text-[13px] font-medium text-gray-900">{{ i.patient_name }}</p>
                  <p class="text-[11px] text-gray-500">{{ i.patient_code }}</p>
                </td>
                <td class="px-5 py-3.5 text-[13px] font-semibold text-gray-900">{{ rupiah(i.amount) }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ formatDate(i.issue_date) }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ i.due_date ? formatDate(i.due_date) : '-' }}</td>
                <td class="px-5 py-3.5">
                  <Badge :label="invoiceStatus(i.status).label" :tone="invoiceStatus(i.status).tone" />
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex gap-1">
                    <button
                      v-if="i.status !== 'paid' && i.status !== 'cancelled'"
                      class="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
                      @click="askPay(i)"
                    >
                      Bayar
                    </button>
                    <button class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors" title="Edit" @click="openEdit(i)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      v-if="canDelete"
                      class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus"
                      @click="askDelete(i)"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td :colspan="headers.length">
                  <EmptyState title="Tidak ada invoice" description="Buat invoice baru untuk pasien." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <AppModal :open="modal" :title="editing ? 'Edit Invoice' : 'Invoice Baru'" @close="modal = false">
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <SelectField v-model="form.patient_id" label="Pasien" :options="patientOptions" required :error="errors.patient_id" />
        </div>
        <TextField v-model="form.amount" label="Jumlah (Rp)" type="number" :min="0" required :error="errors.amount" />
        <TextField v-model="form.paid_amount" label="Sudah Dibayar (Rp)" type="number" :min="0" />
        <TextField v-model="form.issue_date" label="Tanggal Terbit" type="date" required :error="errors.issue_date" />
        <TextField v-model="form.due_date" label="Jatuh Tempo" type="date" />
        <div class="col-span-2">
          <TextField v-model="form.description" label="Keterangan" placeholder="Contoh: Konsultasi + Lab" />
        </div>
        <div class="col-span-2">
          <SelectField v-model="form.status" label="Status" :options="statusOptions" />
        </div>
      </form>

      <template #footer>
        <button class="h-9 px-4 rounded-lg border border-[#E8EDF2] text-[12.5px] font-semibold text-gray-700 hover:bg-neutral-light" @click="modal = false">
          Batal
        </button>
        <button
          class="h-9 px-4 rounded-lg bg-accent text-white text-[12.5px] font-semibold hover:bg-accent-dark disabled:opacity-60"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </template>
    </AppModal>

    <ConfirmDialog
      :open="!!paying"
      title="Tandai lunas?"
      :message="`Invoice ${paying?.code} sebesar ${paying ? rupiah(paying.amount) : ''} akan ditandai lunas.`"
      confirm-text="Ya, lunas"
      :danger="false"
      :loading="payingBusy"
      @cancel="paying = null"
      @confirm="confirmPay"
    />

    <ConfirmDialog
      :open="!!deleting"
      title="Hapus invoice?"
      :message="`Invoice ${deleting?.code} akan dihapus permanen.`"
      confirm-text="Ya, hapus"
      :loading="deletingBusy"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import PageHeader from '../ui/PageHeader.vue'
import BaseButton from '../ui/BaseButton.vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'
import SearchInput from '../ui/SearchInput.vue'
import LoadingState from '../ui/LoadingState.vue'
import EmptyState from '../ui/EmptyState.vue'
import AppModal from '../ui/AppModal.vue'
import TextField from '../ui/TextField.vue'
import SelectField from '../ui/SelectField.vue'
import ConfirmDialog from '../ui/ConfirmDialog.vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../lib/toast.js'
import { useAuth } from '../../lib/auth.js'
import { rupiah, compactRupiah, formatDate, invoiceStatus, todayISO } from '../../lib/format.js'

const toast = useToast()
const { is } = useAuth()

// Hapus invoice hanya untuk admin
const canDelete = computed(() => is('admin'))

const headers = ['Invoice', 'Pasien', 'Jumlah', 'Tanggal', 'Jatuh Tempo', 'Status', '']
const search = ref('')
const statusFilter = ref('')
const invoices = ref([])
const patients = ref([])
const loading = ref(true)

const icon = (paths) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    paths.map((p) => h('path', { d: p })))

const summary = computed(() => {
  const paid = invoices.value.filter((i) => i.status === 'paid')
  const pending = invoices.value.filter((i) => i.status === 'pending' || i.status === 'overdue')
  const paidTotal = paid.reduce((s, i) => s + Number(i.paid_amount), 0)
  const pendingTotal = pending.reduce((s, i) => s + (Number(i.amount) - Number(i.paid_amount)), 0)

  return [
    {
      label: 'Total Pendapatan',
      value: compactRupiah(paidTotal),
      hint: `${paid.length} invoice lunas`,
      text: 'text-gray-900',
      iconBg: 'bg-[#E6F4F3]',
      iconColor: 'text-accent',
      icon: icon(['M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z', 'M3 7V5a2 2 0 0 1 2-2h12', 'M17 14h.01']),
    },
    {
      label: 'Menunggu Pembayaran',
      value: compactRupiah(pendingTotal),
      hint: `${pending.length} invoice belum dibayar`,
      text: 'text-amber-600',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: icon(['M12 8v5l3 2', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z']),
    },
    {
      label: 'Jatuh Tempo',
      value: invoices.value.filter((i) => i.status === 'overdue').length,
      hint: 'invoice perlu ditindaklanjuti',
      text: 'text-rose-600',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      icon: icon(['M12 9v4M12 17h.01', 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z']),
    },
  ]
})

const patientOptions = computed(() => patients.value.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })))

const statusOptions = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'paid', label: 'Lunas' },
  { value: 'overdue', label: 'Jatuh Tempo' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return invoices.value.filter((i) => {
    const matchQ = !q || i.code?.toLowerCase().includes(q) || i.patient_name?.toLowerCase().includes(q)
    const matchS = !statusFilter.value || i.status === statusFilter.value
    return matchQ && matchS
  })
})

async function load() {
  loading.value = true
  try {
    invoices.value = await api.get('/invoices')
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function loadRefs() {
  try {
    patients.value = await api.get('/patients')
  } catch (e) {
    toast.error(e.message)
  }
}

const modal = ref(false)
const saving = ref(false)
const editing = ref(null)
const errors = ref({})

const blank = () => ({
  patient_id: '',
  amount: 0,
  paid_amount: 0,
  issue_date: todayISO(),
  due_date: '',
  description: '',
  status: 'pending',
})
const form = ref(blank())

function openCreate() {
  editing.value = null
  errors.value = {}
  form.value = blank()
  modal.value = true
}

function openEdit(i) {
  editing.value = i
  errors.value = {}
  form.value = {
    patient_id: i.patient_id,
    amount: Number(i.amount),
    paid_amount: Number(i.paid_amount),
    issue_date: i.issue_date,
    due_date: i.due_date ?? '',
    description: i.description ?? '',
    status: i.status,
  }
  modal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.patient_id) errors.value.patient_id = 'Pasien wajib dipilih.'
  if (!form.value.amount || Number(form.value.amount) <= 0) errors.value.amount = 'Jumlah harus lebih dari 0.'
  if (!form.value.issue_date) errors.value.issue_date = 'Tanggal wajib diisi.'
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const payload = { ...form.value, due_date: form.value.due_date || null }
    if (editing.value) {
      await api.put(`/invoices/${editing.value.id}`, payload)
      toast.success('Invoice diperbarui.')
    } else {
      await api.post('/invoices', payload)
      toast.success('Invoice dibuat.')
    }
    modal.value = false
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

const paying = ref(null)
const payingBusy = ref(false)
const askPay = (i) => (paying.value = i)

async function confirmPay() {
  payingBusy.value = true
  try {
    await api.patch(`/invoices/${paying.value.id}/pay`, {})
    toast.success('Invoice ditandai lunas.')
    paying.value = null
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    payingBusy.value = false
  }
}

const deleting = ref(null)
const deletingBusy = ref(false)
const askDelete = (i) => (deleting.value = i)

async function confirmDelete() {
  deletingBusy.value = true
  try {
    await api.del(`/invoices/${deleting.value.id}`)
    toast.success('Invoice dihapus.')
    deleting.value = null
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    deletingBusy.value = false
  }
}

onMounted(() => {
  load()
  loadRefs()
})
</script>
