<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader
      title="Patients"
      :subtitle="
        canWrite
          ? 'Kelola seluruh data pasien terdaftar.'
          : 'Daftar pasien yang pernah Anda tangani.'
      "
    >
      <template #actions>
        <BaseButton variant="secondary" :disabled="!filtered.length" @click="exportCsv">Export CSV</BaseButton>
        <BaseButton v-if="canWrite" @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Tambah Pasien
        </BaseButton>
      </template>
    </PageHeader>

    <Card title="Daftar Pasien" :subtitle="`${filtered.length} pasien terdaftar`" body-class="p-0">
      <template #actions>
        <div class="flex items-center gap-2">
          <SearchInput v-model="search" placeholder="Cari nama, email, kode..." class="w-[240px]" />
          <select
            v-model="statusFilter"
            class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
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
              <tr v-for="p in paged" :key="p.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold shrink-0" :class="avatarClass(p.name)">
                      {{ initials(p.name) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-[13px] font-semibold text-gray-900 truncate">{{ p.name }}</p>
                      <p class="text-[11px] text-gray-500">{{ p.code }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ p.email || '-' }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ p.phone || '-' }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ p.age ? p.age + ' th' : '-' }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ p.last_visit ? formatDate(p.last_visit) : '-' }}</td>
                <td class="px-5 py-3.5">
                  <Badge :label="patientStatus(p.status).label" :tone="patientStatus(p.status).tone" />
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex gap-1">
                    <button
                      v-if="canWrite"
                      class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors"
                      title="Edit"
                      @click="openEdit(p)"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      v-if="canDelete"
                      class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus"
                      @click="askDelete(p)"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                    <span v-if="!canWrite" class="text-[11px] text-gray-400 pr-1">Hanya lihat</span>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td :colspan="headers.length">
                  <EmptyState
                    :title="search || statusFilter ? 'Tidak ada pasien yang cocok' : 'Belum ada pasien'"
                    description="Coba ubah filter atau tambahkan pasien baru."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filtered.length" class="flex items-center justify-between px-5 py-3.5 border-t border-[#E8EDF2]">
          <p class="text-[12px] text-gray-500">
            Menampilkan {{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, filtered.length) }} dari {{ filtered.length }} pasien
          </p>
          <div class="flex items-center gap-1">
            <button class="h-8 px-3 rounded-lg border border-[#E8EDF2] text-[12px] text-gray-600 hover:bg-neutral-light disabled:opacity-40" :disabled="page === 1" @click="page--">
              Prev
            </button>
            <button
              v-for="n in totalPages"
              :key="n"
              class="h-8 w-8 rounded-lg text-[12px] font-semibold transition-colors"
              :class="n === page ? 'bg-accent text-white' : 'border border-[#E8EDF2] text-gray-600 hover:bg-neutral-light'"
              @click="page = n"
            >
              {{ n }}
            </button>
            <button class="h-8 px-3 rounded-lg border border-[#E8EDF2] text-[12px] text-gray-600 hover:bg-neutral-light disabled:opacity-40" :disabled="page === totalPages" @click="page++">
              Next
            </button>
          </div>
        </div>
      </template>
    </Card>

    <!-- Modal form -->
    <AppModal
      :open="modal"
      :title="editing ? 'Edit Pasien' : 'Tambah Pasien'"
      :subtitle="editing ? `Kode ${form.code}` : 'Kode pasien dibuat otomatis.'"
      @close="modal = false"
    >
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <TextField v-model="form.name" label="Nama Lengkap" placeholder="Nama pasien" required :error="errors.name" />
        </div>
        <TextField v-model="form.email" label="Email" type="email" placeholder="email@contoh.com" :error="errors.email" />
        <TextField v-model="form.phone" label="Telepon" placeholder="0812-xxxx-xxxx" />
        <SelectField v-model="form.gender" label="Jenis Kelamin" :options="genderOptions" />
        <TextField v-model="form.birth_date" label="Tanggal Lahir" type="date" />
        <SelectField v-model="form.blood_type" label="Golongan Darah" :options="bloodOptions" placeholder="Tidak tahu" />
        <SelectField v-model="form.status" label="Status" :options="patientStatusOptions" />
        <div class="col-span-2">
          <TextareaField v-model="form.address" label="Alamat" :rows="2" placeholder="Alamat lengkap" />
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
          {{ saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Pasien' }}
        </button>
      </template>
    </AppModal>

    <ConfirmDialog
      :open="!!deleting"
      title="Hapus pasien?"
      :message="`Data ${deleting?.name} beserta appointment, rekam medis, dan invoice terkait akan ikut terhapus.`"
      confirm-text="Ya, hapus"
      :loading="deletingBusy"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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
import { formatDate, initials, avatarClass, patientStatus } from '../../lib/format.js'

const route = useRoute()
const toast = useToast()
const { is } = useAuth()

// Dokter hanya boleh membaca; staf boleh tambah/ubah; hanya admin boleh hapus
const canWrite = computed(() => is('admin', 'staff'))
const canDelete = computed(() => is('admin'))

const headers = ['Pasien', 'Email', 'Telepon', 'Usia', 'Kunjungan Terakhir', 'Status', '']
const search = ref(route.query.q || '')
const statusFilter = ref('')
const patients = ref([])
const loading = ref(true)

const page = ref(1)
const perPage = 10

const genderOptions = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
  { value: 'other', label: 'Lainnya' },
]
const bloodOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }))
const patientStatusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
]

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return patients.value.filter((p) => {
    const matchQ =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.code?.toLowerCase().includes(q)
    const matchS = !statusFilter.value || p.status === statusFilter.value
    return matchQ && matchS
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

watch([search, statusFilter], () => {
  page.value = 1
})
watch(totalPages, (t) => {
  if (page.value > t) page.value = t
})

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (search.value.trim()) params.set('search', search.value.trim())
    if (statusFilter.value) params.set('status', statusFilter.value)
    const qs = params.toString()
    patients.value = await api.get(`/patients${qs ? '?' + qs : ''}`)
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

// ---- form ----
const modal = ref(false)
const saving = ref(false)
const editing = ref(null)
const errors = ref({})

const blank = () => ({
  name: '',
  email: '',
  phone: '',
  gender: 'male',
  birth_date: '',
  address: '',
  blood_type: '',
  status: 'active',
  code: '',
})
const form = ref(blank())

function openCreate() {
  editing.value = null
  errors.value = {}
  form.value = blank()
  modal.value = true
}

function openEdit(p) {
  editing.value = p
  errors.value = {}
  form.value = {
    name: p.name ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    gender: p.gender ?? 'other',
    birth_date: p.birth_date ?? '',
    address: p.address ?? '',
    blood_type: p.blood_type ?? '',
    status: p.status ?? 'active',
    code: p.code ?? '',
  }
  modal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name.trim()) {
    errors.value.name = 'Nama wajib diisi.'
    return
  }

  saving.value = true
  try {
    const payload = { ...form.value, birth_date: form.value.birth_date || null, blood_type: form.value.blood_type || null }
    if (editing.value) {
      await api.put(`/patients/${editing.value.id}`, payload)
      toast.success('Data pasien diperbarui.')
    } else {
      await api.post('/patients', payload)
      toast.success('Pasien baru ditambahkan.')
    }
    modal.value = false
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

// ---- delete ----
const deleting = ref(null)
const deletingBusy = ref(false)

function askDelete(p) {
  deleting.value = p
}

async function confirmDelete() {
  deletingBusy.value = true
  try {
    await api.del(`/patients/${deleting.value.id}`)
    toast.success('Pasien dihapus.')
    deleting.value = null
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    deletingBusy.value = false
  }
}

function exportCsv() {
  const rows = [
    ['Kode', 'Nama', 'Email', 'Telepon', 'Usia', 'Status'],
    ...filtered.value.map((p) => [p.code, p.name, p.email ?? '', p.phone ?? '', p.age ?? '', p.status]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV diunduh.')
}

onMounted(load)
</script>
