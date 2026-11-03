<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader title="Doctors" :subtitle="canManage ? 'Data dokter dan jadwal praktik.' : 'Daftar dokter klinik (hanya lihat).'">
      <template #actions>
        <BaseButton v-if="canManage" @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Tambah Dokter
        </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" />

    <template v-else>
      <!-- Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div
          v-for="d in filtered.slice(0, 8)"
          :key="d.id"
          class="bg-white rounded-xl border border-[#E8EDF2] p-4 hover:border-accent/40 hover:shadow-[0_4px_16px_rgba(23,43,77,0.06)] transition-all cursor-pointer"
          @click="openEdit(d)"
        >
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-full grid place-items-center text-[12px] font-bold shrink-0" :class="avatarClass(d.name)">
              {{ initials(d.name) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-semibold text-gray-900 truncate">{{ d.name }}</p>
              <p class="text-[11px] text-gray-500 truncate">{{ d.specialization }}</p>
            </div>
          </div>
          <div class="mt-3.5 flex items-center justify-between text-[11px]">
            <span class="text-gray-500">{{ d.patients_count }} pasien</span>
            <Badge :label="doctorStatus(d.status).label" :tone="doctorStatus(d.status).tone" />
          </div>
        </div>
        <div v-if="!filtered.length" class="col-span-full">
          <div class="bg-white rounded-xl border border-[#E8EDF2]">
            <EmptyState title="Belum ada dokter" description="Tambahkan dokter pertama Anda." />
          </div>
        </div>
      </div>

      <Card title="Daftar Dokter" :subtitle="`${filtered.length} dokter`" body-class="p-0">
        <template #actions>
          <div class="flex items-center gap-2">
            <SearchInput v-model="search" placeholder="Cari dokter..." class="w-[200px]" />
            <select v-model="deptFilter" class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent">
              <option value="">Semua Departemen</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[780px]">
            <thead>
              <tr class="border-b border-[#E8EDF2] bg-neutral-light/60">
                <th v-for="h in headers" :key="h" class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="d in filtered" :key="d.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold shrink-0" :class="avatarClass(d.name)">
                      {{ initials(d.name) }}
                    </div>
                    <p class="text-[13px] font-semibold text-gray-900">{{ d.name }}</p>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ d.specialization }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ d.department_name || '-' }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ d.phone || '-' }}</td>
                <td class="px-5 py-3.5 text-[13px] font-semibold text-gray-800">{{ d.patients_count }}</td>
                <td class="px-5 py-3.5">
                  <Badge :label="doctorStatus(d.status).label" :tone="doctorStatus(d.status).tone" />
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex gap-1">
                    <template v-if="canManage">
                      <button class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors" title="Edit" @click="openEdit(d)">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Hapus" @click="askDelete(d)">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </template>
                    <span v-else class="text-[11px] text-gray-400 pr-1">Hanya lihat</span>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td :colspan="headers.length">
                  <EmptyState title="Tidak ada dokter yang cocok" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <AppModal :open="modal" :title="editing ? 'Edit Dokter' : 'Tambah Dokter'" @close="modal = false">
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <TextField v-model="form.name" label="Nama Lengkap" placeholder="Dr. Nama Dokter" required :error="errors.name" />
        </div>
        <TextField v-model="form.specialization" label="Spesialisasi" placeholder="Cardiologist" required :error="errors.specialization" />
        <SelectField v-model="form.department_id" label="Departemen" :options="deptOptions" placeholder="Tidak ada" />
        <TextField v-model="form.email" label="Email" type="email" />
        <TextField v-model="form.phone" label="Telepon" placeholder="0811-xxxx" />
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
      title="Hapus dokter?"
      :message="`Data ${deleting?.name} dan appointment terkait akan terhapus.`"
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
import SelectField from '../ui/SelectField.vue'
import ConfirmDialog from '../ui/ConfirmDialog.vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../lib/toast.js'
import { useAuth } from '../../lib/auth.js'
import { initials, avatarClass, doctorStatus } from '../../lib/format.js'

const toast = useToast()
const { is } = useAuth()

// Hanya admin yang boleh menambah/mengubah/menghapus dokter
const canManage = computed(() => is('admin'))

const headers = ['Dokter', 'Spesialisasi', 'Departemen', 'Telepon', 'Pasien', 'Status', '']
const search = ref('')
const deptFilter = ref('')
const doctors = ref([])
const departments = ref([])
const loading = ref(true)

const deptOptions = computed(() => departments.value.map((d) => ({ value: d.id, label: d.name })))

const statusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'on_leave', label: 'Cuti' },
  { value: 'inactive', label: 'Nonaktif' },
]

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return doctors.value.filter((d) => {
    const matchQ = !q || d.name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q)
    const matchD = !deptFilter.value || String(d.department_id) === String(deptFilter.value)
    return matchQ && matchD
  })
})

async function load() {
  loading.value = true
  try {
    const [d, dep] = await Promise.all([api.get('/doctors'), api.get('/departments')])
    doctors.value = d
    departments.value = dep
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

const modal = ref(false)
const saving = ref(false)
const editing = ref(null)
const errors = ref({})

const blank = () => ({ name: '', specialization: '', department_id: '', email: '', phone: '', status: 'active' })
const form = ref(blank())

function openCreate() {
  editing.value = null
  errors.value = {}
  form.value = blank()
  modal.value = true
}

function openEdit(d) {
  editing.value = d
  errors.value = {}
  form.value = {
    name: d.name ?? '',
    specialization: d.specialization ?? '',
    department_id: d.department_id ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    status: d.status ?? 'active',
  }
  modal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name.trim()) errors.value.name = 'Nama wajib diisi.'
  if (!form.value.specialization.trim()) errors.value.specialization = 'Spesialisasi wajib diisi.'
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const payload = { ...form.value, department_id: form.value.department_id || null }
    if (editing.value) {
      await api.put(`/doctors/${editing.value.id}`, payload)
      toast.success('Data dokter diperbarui.')
    } else {
      await api.post('/doctors', payload)
      toast.success('Dokter ditambahkan.')
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
const askDelete = (d) => (deleting.value = d)

async function confirmDelete() {
  deletingBusy.value = true
  try {
    await api.del(`/doctors/${deleting.value.id}`)
    toast.success('Dokter dihapus.')
    deleting.value = null
    await load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    deletingBusy.value = false
  }
}

onMounted(load)
</script>
