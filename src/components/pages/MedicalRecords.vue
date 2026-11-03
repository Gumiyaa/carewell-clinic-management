<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader
      title="Medical Records"
      :subtitle="
        isScopedDoctor
          ? 'Rekam medis pasien yang Anda tangani.'
          : 'Riwayat medis dan hasil pemeriksaan.'
      "
    >
      <template #actions>
        <BaseButton @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Rekam Medis Baru
        </BaseButton>
      </template>
    </PageHeader>

    <Card title="Daftar Rekam Medis" :subtitle="`${filtered.length} rekaman`" body-class="p-0">
      <template #actions>
        <div class="flex items-center gap-2">
          <SearchInput v-model="search" placeholder="Cari pasien / diagnosis..." class="w-[230px]" />
          <select v-model="typeFilter" class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent">
            <option value="">Semua Tipe</option>
            <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <select v-model="statusFilter" class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent">
            <option value="">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="pending">Menunggu</option>
          </select>
        </div>
      </template>

      <LoadingState v-if="loading" />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[820px]">
            <thead>
              <tr class="border-b border-[#E8EDF2] bg-neutral-light/60">
                <th v-for="h in headers" :key="h" class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="r in filtered" :key="r.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5">
                  <p class="text-[13px] font-semibold text-gray-900">{{ r.patient_name }}</p>
                  <p class="text-[11px] text-gray-500">{{ r.patient_code }}</p>
                </td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex items-center gap-1.5 rounded-md bg-neutral-light border border-[#E8EDF2] px-2 py-1 text-[11px] font-medium text-gray-700">
                    <svg class="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    {{ recordTypeLabel(r.record_type) }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <p class="text-[13px] text-gray-700">{{ r.diagnosis || '-' }}</p>
                  <p class="text-[11px] text-gray-400 truncate max-w-[220px]">{{ r.description || '' }}</p>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ formatDate(r.record_date) }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ r.doctor_name || '-' }}</td>
                <td class="px-5 py-3.5">
                  <Badge :label="r.status === 'completed' ? 'Selesai' : 'Menunggu'" :tone="r.status === 'completed' ? 'success' : 'warning'" />
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex gap-1">
                    <button class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors" title="Edit" @click="openEdit(r)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      v-if="canDelete"
                      class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus"
                      @click="askDelete(r)"
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
                  <EmptyState title="Tidak ada rekam medis" description="Tambahkan rekam medis baru." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <AppModal :open="modal" :title="editing ? 'Edit Rekam Medis' : 'Rekam Medis Baru'" size="md" @close="modal = false">
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <SelectField v-model="form.patient_id" label="Pasien" :options="patientOptions" required :error="errors.patient_id" />
        </div>
        <SelectField
          v-model="form.doctor_id"
          label="Dokter"
          :options="doctorOptions"
          :disabled="isScopedDoctor"
          placeholder="Tidak ada"
        />
        <SelectField v-model="form.record_type" label="Tipe Rekaman" :options="typeOptions" required :error="errors.record_type" />
        <div class="col-span-2">
          <TextField v-model="form.diagnosis" label="Diagnosis" placeholder="Contoh: Hipertensi stadium 1" />
        </div>
        <div class="col-span-2">
          <TextareaField v-model="form.description" label="Keterangan" :rows="3" />
        </div>
        <TextField v-model="form.record_date" label="Tanggal" type="date" required :error="errors.record_date" />
        <SelectField v-model="form.status" label="Status" :options="statusOptions" />
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
      :open="!!deleting"
      title="Hapus rekam medis?"
      :message="`Rekam medis ${deleting?.patient_name} akan dihapus permanen.`"
      confirm-text="Ya, hapus"
      :loading="deletingBusy"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../ui/PageHeader.vue'
import BaseButton from '../ui/BaseButton.vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'
import SearchInput from '../ui/SearchInput.vue'
import LoadingState from '../ui/LoadingState.vue'
import EmptyState from '../ui/EmptyState.vue'
import AppModal from '../ui/AppModal.vue'
import TextField from '../ui/TextField.vue'
import TextareaField from '../ui/TextareaField.vue'
import SelectField from '../ui/SelectField.vue'
import ConfirmDialog from '../ui/ConfirmDialog.vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../lib/toast.js'
import { useAuth } from '../../lib/auth.js'
import { formatDate, recordTypeLabel, todayISO } from '../../lib/format.js'

const toast = useToast()
const { is, isScopedDoctor, state } = useAuth()

// Hapus rekam medis hanya untuk admin
const canDelete = computed(() => is('admin'))

const headers = ['Pasien', 'Tipe', 'Diagnosis', 'Tanggal', 'Dokter', 'Status', '']
const search = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const records = ref([])
const patients = ref([])
const doctors = ref([])
const loading = ref(true)

const typeOptions = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'ecg', label: 'ECG' },
  { value: 'blood_test', label: 'Blood Test' },
  { value: 'consultation', label: 'Konsultasi' },
  { value: 'prescription', label: 'Resep' },
]
const statusOptions = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'completed', label: 'Selesai' },
]

const patientOptions = computed(() => patients.value.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })))
const doctorOptions = computed(() => doctors.value.map((d) => ({ value: d.id, label: d.name })))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return records.value.filter((r) => {
    const matchQ = !q || r.patient_name?.toLowerCase().includes(q) || r.diagnosis?.toLowerCase().includes(q)
    const matchT = !typeFilter.value || r.record_type === typeFilter.value
    const matchS = !statusFilter.value || r.status === statusFilter.value
    return matchQ && matchT && matchS
  })
})

async function load() {
  loading.value = true
  try {
    records.value = await api.get('/records')
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function loadRefs() {
  try {
    const p = await api.get('/patients')
    patients.value = p

    // Dokter tidak punya akses ke /doctors — cukup pakai data dirinya sendiri
    if (isScopedDoctor.value) {
      doctors.value = [{ id: state.user?.doctorId, name: state.user?.name }]
    } else {
      try {
        doctors.value = await api.get('/doctors')
      } catch {
        doctors.value = []
      }
    }
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
  doctor_id: '',
  record_type: 'consultation',
  diagnosis: '',
  description: '',
  record_date: todayISO(),
  status: 'pending',
})
const form = ref(blank())

function openCreate() {
  editing.value = null
  errors.value = {}
  form.value = blank()
  if (isScopedDoctor.value) form.value.doctor_id = state.user?.doctorId
  modal.value = true
}

function openEdit(r) {
  editing.value = r
  errors.value = {}
  form.value = {
    patient_id: r.patient_id,
    doctor_id: r.doctor_id ?? '',
    record_type: r.record_type,
    diagnosis: r.diagnosis ?? '',
    description: r.description ?? '',
    record_date: r.record_date,
    status: r.status,
  }
  modal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.patient_id) errors.value.patient_id = 'Pasien wajib dipilih.'
  if (!form.value.record_type) errors.value.record_type = 'Tipe wajib dipilih.'
  if (!form.value.record_date) errors.value.record_date = 'Tanggal wajib diisi.'
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const payload = { ...form.value, doctor_id: form.value.doctor_id || null }
    if (editing.value) {
      await api.put(`/records/${editing.value.id}`, payload)
      toast.success('Rekam medis diperbarui.')
    } else {
      await api.post('/records', payload)
      toast.success('Rekam medis ditambahkan.')
    }
    modal.value = false
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

const deleting = ref(null)
const deletingBusy = ref(false)
const askDelete = (r) => (deleting.value = r)

async function confirmDelete() {
  deletingBusy.value = true
  try {
    await api.del(`/records/${deleting.value.id}`)
    toast.success('Rekam medis dihapus.')
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
