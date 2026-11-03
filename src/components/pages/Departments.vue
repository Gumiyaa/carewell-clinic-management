<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader
      title="Departments"
      :subtitle="canManage ? 'Ringkasan unit dan kapasitas klinik.' : 'Daftar unit klinik (hanya lihat).'"
    >
      <template #actions>
        <BaseButton v-if="canManage" @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Departemen Baru
        </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" />

    <template v-else>
      <div v-if="departments.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
        <div
          v-for="d in departments"
          :key="d.id"
          class="bg-white rounded-xl border border-[#E8EDF2] p-5 hover:border-accent/40 hover:shadow-[0_4px_16px_rgba(23,43,77,0.06)] transition-all"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-lg grid place-items-center shrink-0" :class="avatarClass(d.name)">
                {{ initials(d.name) }}
              </div>
              <div class="min-w-0">
                <p class="text-[14px] font-semibold text-gray-900 truncate">{{ d.name }}</p>
                <p class="text-[11px] text-gray-500 truncate">{{ d.head_doctor || 'Belum ada kepala' }}</p>
              </div>
            </div>
            <Badge :label="d.is_active ? 'Aktif' : 'Nonaktif'" :tone="d.is_active ? 'success' : 'neutral'" />
          </div>

          <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#F1F5F9]">
            <div class="text-center">
              <p class="text-[16px] font-bold text-gray-900 leading-none">{{ d.doctors_count }}</p>
              <p class="text-[10px] text-gray-500 mt-1">Dokter</p>
            </div>
            <div class="text-center">
              <p class="text-[16px] font-bold text-gray-900 leading-none">{{ d.used_beds }}/{{ d.total_beds }}</p>
              <p class="text-[10px] text-gray-500 mt-1">Bed</p>
            </div>
            <div class="text-center">
              <p class="text-[16px] font-bold text-gray-900 leading-none">{{ d.patients_count }}</p>
              <p class="text-[10px] text-gray-500 mt-1">Pasien</p>
            </div>
          </div>

          <div class="mt-4">
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="text-gray-500">Okupansi bed</span>
              <span class="font-semibold text-gray-700">{{ occupancy(d) }}%</span>
            </div>
            <div class="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-accent transition-all" :style="{ width: occupancy(d) + '%' }" />
            </div>
          </div>

          <div v-if="canManage" class="flex gap-2 mt-4">
            <button class="flex-1 h-8 rounded-lg bg-neutral-light border border-[#E8EDF2] text-[12px] font-semibold text-gray-700 hover:bg-gray-100" @click="openEdit(d)">
              Edit
            </button>
            <button class="h-8 w-8 rounded-lg border border-[#E8EDF2] grid place-items-center text-gray-400 hover:text-rose-600 hover:bg-rose-50" @click="askDelete(d)">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-xl border border-[#E8EDF2] mb-5">
        <EmptyState title="Belum ada departemen" description="Tambahkan departemen pertama Anda." />
      </div>

      <Card v-if="departments.length" title="Ringkasan Departemen" body-class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px]">
            <thead>
              <tr class="border-b border-[#E8EDF2] bg-neutral-light/60">
                <th v-for="h in ['Departemen', 'Kepala', 'Dokter', 'Pasien', 'Okupansi', 'Status']" :key="h" class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="d in departments" :key="d.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5 text-[13px] font-semibold text-gray-900">{{ d.name }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ d.head_doctor || '-' }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ d.doctors_count }}</td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ d.patients_count }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2 w-[120px]">
                    <div class="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div class="h-full rounded-full bg-accent" :style="{ width: occupancy(d) + '%' }" />
                    </div>
                    <span class="text-[11px] font-semibold text-gray-600 w-8">{{ occupancy(d) }}%</span>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <Badge :label="d.is_active ? 'Aktif' : 'Nonaktif'" :tone="d.is_active ? 'success' : 'neutral'" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <AppModal :open="modal" :title="editing ? 'Edit Departemen' : 'Departemen Baru'" @close="modal = false">
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <TextField v-model="form.name" label="Nama Departemen" placeholder="Cardiology" required :error="errors.name" />
        </div>
        <div class="col-span-2">
          <TextField v-model="form.head_doctor" label="Kepala Departemen" placeholder="Dr. Nama" />
        </div>
        <TextField v-model="form.total_beds" label="Total Bed" type="number" :min="0" />
        <TextField v-model="form.used_beds" label="Bed Terpakai" type="number" :min="0" />
        <div class="col-span-2">
          <TextareaField v-model="form.description" label="Deskripsi" :rows="2" />
        </div>
        <div class="col-span-2">
          <SelectField v-model="form.is_active" label="Status" :options="activeOptions" />
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
      title="Hapus departemen?"
      :message="`Departemen ${deleting?.name} akan dihapus. Dokter terkait akan menjadi tanpa departemen.`"
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
import { initials, avatarClass } from '../../lib/format.js'

const toast = useToast()
const { is } = useAuth()

// Hanya admin yang boleh mengelola departemen
const canManage = computed(() => is('admin'))

const departments = ref([])
const loading = ref(true)

const activeOptions = [
  { value: 1, label: 'Aktif' },
  { value: 0, label: 'Nonaktif' },
]

const occupancy = (d) => (d.total_beds ? Math.round((d.used_beds / d.total_beds) * 100) : 0)

async function load() {
  loading.value = true
  try {
    departments.value = await api.get('/departments')
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

const blank = () => ({ name: '', head_doctor: '', description: '', total_beds: 0, used_beds: 0, is_active: 1 })
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
    head_doctor: d.head_doctor ?? '',
    description: d.description ?? '',
    total_beds: d.total_beds ?? 0,
    used_beds: d.used_beds ?? 0,
    is_active: d.is_active ? 1 : 0,
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
    if (editing.value) {
      await api.put(`/departments/${editing.value.id}`, form.value)
      toast.success('Departemen diperbarui.')
    } else {
      await api.post('/departments', form.value)
      toast.success('Departemen ditambahkan.')
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
    await api.del(`/departments/${deleting.value.id}`)
    toast.success('Departemen dihapus.')
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
