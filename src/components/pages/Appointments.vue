<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader title="Appointments" subtitle="Jadwal dan antrian pasien.">
      <template #actions>
        <BaseButton @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Appointment Baru
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <div v-for="s in summary" :key="s.label" class="bg-white rounded-xl border border-[#E8EDF2] px-4 py-3.5">
        <p class="text-[11px] font-medium text-gray-500">{{ s.label }}</p>
        <p class="text-[22px] font-bold mt-1 leading-none" :class="s.text">{{ s.value }}</p>
      </div>
    </div>

    <Card title="Daftar Appointment" :subtitle="`${filtered.length} jadwal ditampilkan`" body-class="p-0">
      <template #actions>
        <div class="flex items-center gap-2">
          <SearchInput v-model="search" placeholder="Cari pasien / dokter..." class="w-[220px]" />
          <select v-model="statusFilter" class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent">
            <option value="">Semua Status</option>
            <option value="scheduled">Terjadwal</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="no_show">Tidak Hadir</option>
          </select>
          <input
            v-model="dateFilter"
            type="date"
            class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent"
          />
        </div>
      </template>

      <LoadingState v-if="loading" />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px]">
            <thead>
              <tr class="border-b border-[#E8EDF2] bg-neutral-light/60">
                <th v-for="h in headers" :key="h" class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="a in filtered" :key="a.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold shrink-0" :class="avatarClass(a.patient_name)">
                      {{ initials(a.patient_name) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-[13px] font-semibold text-gray-900 truncate">{{ a.patient_name }}</p>
                      <p class="text-[11px] text-gray-500">{{ a.patient_code }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ a.doctor_name }}</td>
                <td class="px-5 py-3.5">
                  <p class="text-[13px] font-medium text-gray-800">{{ formatDate(a.scheduled_at) }}</p>
                  <p class="text-[11px] text-gray-500">{{ formatTime(a.scheduled_at) }} · {{ a.duration_min }} mnt</p>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ a.department_name || '-' }}</td>
                <td class="px-5 py-3.5">
                  <Badge :label="apptStatus(a.status).label" :tone="apptStatus(a.status).tone" />
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex gap-1">
                    <button
                      v-if="a.status === 'scheduled'"
                      class="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Tandai selesai"
                      @click="setStatus(a, 'completed')"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    </button>
                    <button class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors" title="Edit" @click="openEdit(a)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Hapus" @click="askDelete(a)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td :colspan="headers.length">
                  <EmptyState title="Tidak ada appointment" description="Ubah filter atau buat jadwal baru." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <AppModal
      :open="modal"
      :title="editing ? 'Edit Appointment' : 'Appointment Baru'"
      @close="modal = false"
    >
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <SelectField v-model="form.patient_id" label="Pasien" :options="patientOptions" required :error="errors.patient_id" />
        </div>
        <SelectField
          v-model="form.doctor_id"
          label="Dokter"
          :options="doctorOptions"
          :disabled="isScopedDoctor"
          required
          :error="errors.doctor_id"
        />
        <SelectField v-model="form.department_id" label="Departemen" :options="deptOptions" placeholder="Tidak ada" />
        <TextField v-model="form.scheduled_at" label="Tanggal & Jam" type="datetime-local" required :error="errors.scheduled_at" />
        <TextField v-model="form.duration_min" label="Durasi (menit)" type="number" :min="5" :step="5" />
        <div class="col-span-2">
          <TextField v-model="form.reason" label="Alasan Kunjungan" placeholder="Contoh: kontrol tekanan darah" />
        </div>
        <div class="col-span-2">
          <TextareaField v-model="form.notes" label="Catatan" :rows="2" />
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
      :open="!!deleting"
      title="Hapus appointment?"
      :message="`Jadwal ${deleting?.patient_name} akan dihapus permanen.`"
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
import { formatDate, formatTime, initials, avatarClass, apptStatus, todayISO } from '../../lib/format.js'
import { useAuth } from '../../lib/auth.js'

const toast = useToast()
const { state, isScopedDoctor } = useAuth()
const me = computed(() => state.user)

const headers = ['Pasien', 'Dokter', 'Jadwal', 'Departemen', 'Status', '']
const search = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const appointments = ref([])
const loading = ref(true)

const patients = ref([])
const doctors = ref([])
const departments = ref([])

const summary = computed(() => {
  const list = appointments.value
  const today = todayISO()
  return [
    { label: 'Total', value: list.length, text: 'text-gray-900' },
    { label: 'Hari Ini', value: list.filter((a) => String(a.scheduled_at).slice(0, 10) === today).length, text: 'text-sky-600' },
    { label: 'Selesai', value: list.filter((a) => a.status === 'completed').length, text: 'text-emerald-600' },
    { label: 'Dibatalkan', value: list.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length, text: 'text-rose-600' },
  ]
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return appointments.value.filter((a) => {
    const matchQ = !q || a.patient_name?.toLowerCase().includes(q) || a.doctor_name?.toLowerCase().includes(q)
    const matchS = !statusFilter.value || a.status === statusFilter.value
    const matchD = !dateFilter.value || String(a.scheduled_at).slice(0, 10) === dateFilter.value
    return matchQ && matchS && matchD
  })
})

const patientOptions = computed(() => patients.value.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })))
const doctorOptions = computed(() =>
  isScopedDoctor.value
    ? [{ value: me.value?.doctorId, label: `${me.value?.name} (Anda)` }]
    : doctors.value.map((d) => ({ value: d.id, label: d.name }))
)
const deptOptions = computed(() => departments.value.map((d) => ({ value: d.id, label: d.name })))

const statusOptions = [
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'no_show', label: 'Tidak Hadir' },
]

async function load() {
  loading.value = true
  try {
    appointments.value = await api.get('/appointments')
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function loadRefs() {
  try {
    const [p, dep] = await Promise.all([api.get('/patients'), api.get('/departments')])
    patients.value = p
    departments.value = dep

    // Dokter tidak punya akses ke /doctors; dropdown diisi dari akun sendiri
    if (!isScopedDoctor.value) await loadDoctors()
  } catch (e) {
    toast.error(e.message)
  }
}

async function loadDoctors() {
  try {
    doctors.value = await api.get('/doctors')
  } catch {
    doctors.value = []
  }
}

// ---- form ----
const modal = ref(false)
const saving = ref(false)
const editing = ref(null)
const errors = ref({})

const blank = () => ({
  patient_id: '',
  doctor_id: '',
  department_id: '',
  scheduled_at: '',
  duration_min: 30,
  reason: '',
  notes: '',
  status: 'scheduled',
})
const form = ref(blank())

function openCreate() {
  editing.value = null
  errors.value = {}
  const d = new Date()
  d.setMinutes(0, 0, 0)
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  form.value = { ...blank(), scheduled_at: local }
  if (isScopedDoctor.value) form.value.doctor_id = me.value?.doctorId
  modal.value = true
}

function openEdit(a) {
  editing.value = a
  errors.value = {}
  form.value = {
    patient_id: a.patient_id,
    doctor_id: a.doctor_id,
    department_id: a.department_id ?? '',
    scheduled_at: String(a.scheduled_at).replace(' ', 'T').slice(0, 16),
    duration_min: a.duration_min,
    reason: a.reason ?? '',
    notes: a.notes ?? '',
    status: a.status,
  }
  modal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.patient_id) errors.value.patient_id = 'Pasien wajib dipilih.'
  if (!form.value.doctor_id) errors.value.doctor_id = 'Dokter wajib dipilih.'
  if (!form.value.scheduled_at) errors.value.scheduled_at = 'Jadwal wajib diisi.'
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const payload = {
      ...form.value,
      department_id: form.value.department_id || null,
      scheduled_at: form.value.scheduled_at.replace('T', ' ') + ':00',
    }
    if (editing.value) {
      await api.put(`/appointments/${editing.value.id}`, payload)
      toast.success('Appointment diperbarui.')
    } else {
      await api.post('/appointments', payload)
      toast.success('Appointment dibuat.')
    }
    modal.value = false
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

async function setStatus(a, status) {
  try {
    await api.patch(`/appointments/${a.id}/status`, { status })
    toast.success(`Ditandai ${apptStatus(status).label.toLowerCase()}.`)
    await load()
  } catch (e) {
    toast.error(e.message)
  }
}

// ---- delete ----
const deleting = ref(null)
const deletingBusy = ref(false)

const askDelete = (a) => (deleting.value = a)

async function confirmDelete() {
  deletingBusy.value = true
  try {
    await api.del(`/appointments/${deleting.value.id}`)
    toast.success('Appointment dihapus.')
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
