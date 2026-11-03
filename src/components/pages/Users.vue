<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader title="Users" subtitle="Kelola akun staf klinik dan hak aksesnya.">
      <template #actions>
        <BaseButton @click="openCreate">
          <template #icon>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Tambah User
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Tab: akun & jejak aktivitas -->
    <div class="flex items-center gap-1 mb-5 bg-white rounded-xl border border-[#E8EDF2] p-1 w-fit">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="px-3.5 h-8 rounded-lg text-[12.5px] font-semibold transition-colors"
        :class="tab === t.key ? 'bg-accent text-white' : 'text-gray-600 hover:bg-neutral-light'"
        @click="switchTab(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- ============ TAB AKUN ============ -->
    <template v-if="tab === 'akun'">
      <LoadingState v-if="loading" />

      <!-- Ringkasan role -->
      <div v-if="!loading" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div v-for="r in roleSummary" :key="r.role" class="bg-white rounded-xl border border-[#E8EDF2] px-4 py-3.5">
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-medium text-gray-500">{{ r.label }}</p>
            <span class="w-2 h-2 rounded-full" :class="r.dot" />
          </div>
          <p class="text-[22px] font-bold text-gray-900 mt-1 leading-none">{{ r.total }}</p>
          <p class="text-[11px] text-gray-400 mt-1.5">{{ r.desc }}</p>
        </div>
      </div>

      <Card v-if="!loading" title="Daftar Akun" :subtitle="`${filtered.length} akun`" body-class="p-0">
        <template #actions>
          <div class="flex items-center gap-2">
            <SearchInput v-model="search" placeholder="Cari nama atau email..." class="w-[220px]" />
            <select
              v-model="roleFilter"
              class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent"
            >
              <option value="">Semua Role</option>
              <option value="admin">Clinic Admin</option>
              <option value="doctor">Dokter</option>
              <option value="staff">Resepsionis</option>
            </select>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#E8EDF2]">
                <th
                  v-for="h in headers"
                  :key="h"
                  class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-500 whitespace-nowrap"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="u in filtered" :key="u.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold shrink-0" :class="avatarClass(u.name)">
                      {{ initials(u.name) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-[13px] font-semibold text-gray-900 truncate">
                        {{ u.name }}
                        <span v-if="u.id === me?.id" class="text-[10px] font-medium text-accent ml-1">(Anda)</span>
                      </p>
                      <p class="text-[11px] text-gray-500 truncate">{{ u.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <Badge :label="roleLabel(u.role)" :tone="roleTone(u.role)" />
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">
                  <template v-if="u.role === 'doctor'">
                    <span v-if="u.doctor_name">{{ u.doctor_name }}</span>
                    <span v-else class="text-rose-600 text-[12px] font-medium">Belum tertaut</span>
                  </template>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600">{{ formatDate(u.created_at) }}</td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex gap-1">
                    <button class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors" title="Edit" @click="openEdit(u)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button class="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-[#E6F4F3] transition-colors" title="Ganti password" @click="openPassword(u)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="10" width="16" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </button>
                    <button
                      class="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Hapus"
                      :disabled="u.id === me?.id"
                      @click="askDelete(u)"
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
                  <EmptyState title="Tidak ada akun" description="Tambahkan akun staf klinik baru." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <!-- ============ TAB JEJAK AKTIVITAS ============ -->
    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div v-for="s in auditSummaryCards" :key="s.action" class="bg-white rounded-xl border border-[#E8EDF2] px-4 py-3.5">
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-medium text-gray-500">{{ s.label }}</p>
            <span class="w-2 h-2 rounded-full" :class="s.dot" />
          </div>
          <p class="text-[22px] font-bold text-gray-900 mt-1 leading-none">{{ s.total }}</p>
          <p class="text-[11px] text-gray-400 mt-1.5">7 hari terakhir</p>
        </div>
      </div>

      <Card title="Jejak Aktivitas" subtitle="Perubahan data terbaru oleh staf klinik." body-class="p-0">
        <template #actions>
          <div class="flex items-center gap-2">
            <SearchInput v-model="auditSearch" placeholder="Cari nama atau endpoint..." class="w-[240px]" />
            <select
              v-model="auditAction"
              class="h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-700 outline-none focus:border-accent"
            >
              <option value="">Semua Aksi</option>
              <option value="LOGIN">Login</option>
              <option value="POST">Tambah</option>
              <option value="PUT">Ubah</option>
              <option value="PATCH">Ubah sebagian</option>
              <option value="DELETE">Hapus</option>
            </select>
          </div>
        </template>

        <LoadingState v-if="auditLoading" />

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#E8EDF2]">
                <th
                  v-for="h in auditHeaders"
                  :key="h"
                  class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-500 whitespace-nowrap"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="a in auditFiltered" :key="a.id" class="hover:bg-neutral-light/60 transition-colors">
                <td class="px-5 py-3.5 whitespace-nowrap">
                  <Badge :label="actionLabel(a.action)" :tone="actionTone(a.action)" />
                </td>
                <td class="px-5 py-3.5">
                  <p class="text-[13px] font-semibold text-gray-900 truncate">{{ a.user_name || 'Sistem' }}</p>
                  <p class="text-[11px] text-gray-500 truncate">{{ a.ip || '-' }}</p>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">{{ entityLabel(a.entity) }}</td>
                <td class="px-5 py-3.5">
                  <code class="text-[11.5px] text-gray-600 bg-neutral-light px-2 py-1 rounded">{{ a.path }}</code>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-gray-600 whitespace-nowrap">{{ formatDateTime(a.created_at) }}</td>
              </tr>
              <tr v-if="!auditFiltered.length">
                <td :colspan="auditHeaders.length">
                  <EmptyState
                    title="Belum ada aktivitas"
                    description="Jejak akan muncul setelah ada perubahan data."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <!-- Form -->
    <AppModal
      :open="modal"
      :title="editing ? 'Edit User' : 'Tambah User'"
      :subtitle="editing ? 'Ubah data akun dan hak aksesnya.' : 'Buat akun baru untuk staf klinik.'"
      @close="modal = false"
    >
      <form class="grid grid-cols-2 gap-3.5" @submit.prevent="save">
        <div class="col-span-2">
          <TextField v-model="form.name" label="Nama Lengkap" placeholder="Contoh: Rina Resepsionis" required :error="errors.name" />
        </div>
        <div class="col-span-2">
          <TextField v-model="form.email" label="Email" type="email" placeholder="nama@carewell.test" required :error="errors.email" />
        </div>
        <SelectField v-model="form.role" label="Role" :options="roleOptions" required :error="errors.role" />
        <SelectField
          v-model="form.doctor_id"
          label="Tautkan ke Dokter"
          :options="doctorOptions"
          :disabled="form.role !== 'doctor'"
          :placeholder="form.role === 'doctor' ? 'Pilih dokter' : 'Tidak perlu'"
          :error="errors.doctor_id"
        />
        <div class="col-span-2">
          <p class="text-[11px] text-gray-500 leading-relaxed bg-neutral-light rounded-lg px-3 py-2.5">
            <span class="font-semibold text-gray-700">Kenapa perlu ditautkan?</span>
            Akun dengan role Dokter wajib terhubung ke satu baris data dokter. Tautan inilah yang membatasi
            dokter hanya melihat pasien, jadwal, dan rekam medis miliknya sendiri.
          </p>
        </div>
        <div v-if="!editing" class="col-span-2">
          <TextField v-model="form.password" label="Password" type="password" placeholder="Minimal 6 karakter" required :error="errors.password" />
        </div>
      </form>

      <template #footer>
        <BaseButton variant="secondary" @click="modal = false">Batal</BaseButton>
        <BaseButton :disabled="saving" @click="save">
          {{ saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah User' }}
        </BaseButton>
      </template>
    </AppModal>

    <!-- Ganti password -->
    <AppModal :open="!!pwdTarget" title="Ganti Password" :subtitle="pwdTarget?.name" size="sm" @close="pwdTarget = null">
      <TextField v-model="newPassword" label="Password Baru" type="password" placeholder="Minimal 6 karakter" :error="pwdError" />
      <template #footer>
        <BaseButton variant="secondary" @click="pwdTarget = null">Batal</BaseButton>
        <BaseButton :disabled="savingPwd" @click="savePassword">
          {{ savingPwd ? 'Menyimpan...' : 'Simpan' }}
        </BaseButton>
      </template>
    </AppModal>

    <ConfirmDialog
      :open="!!deleting"
      title="Hapus akun?"
      :message="`Akun ${deleting?.name || ''} tidak akan bisa login lagi. Tindakan ini tidak dapat dibatalkan.`"
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
import { useAuth, roleLabel } from '../../lib/auth.js'
import { formatDate, formatDateTime, initials, avatarClass } from '../../lib/format.js'

const toast = useToast()
const { state, setUser } = useAuth()
const me = computed(() => state.user)

const headers = ['Akun', 'Role', 'Data Dokter', 'Dibuat', '']

// ---- tab ----
const tabs = [
  { key: 'akun', label: 'Akun & Hak Akses' },
  { key: 'jejak', label: 'Jejak Aktivitas' },
]
const tab = ref('akun')

const search = ref('')
const roleFilter = ref('')
const users = ref([])
const doctors = ref([])
const loading = ref(true)

const roleOptions = [
  { value: 'admin', label: 'Clinic Admin' },
  { value: 'doctor', label: 'Dokter' },
  { value: 'staff', label: 'Resepsionis' },
]

const roleTone = (r) => ({ admin: 'success', doctor: 'info', staff: 'warning' })[r] ?? 'neutral'

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return users.value.filter((u) => {
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchR = !roleFilter.value || u.role === roleFilter.value
    return matchQ && matchR
  })
})

const roleSummary = computed(() => {
  const count = (r) => users.value.filter((u) => u.role === r).length
  return [
    { role: 'admin', label: 'Clinic Admin', total: count('admin'), desc: 'Akses penuh semua modul', dot: 'bg-emerald-500' },
    { role: 'doctor', label: 'Dokter', total: count('doctor'), desc: 'Hanya data miliknya', dot: 'bg-sky-500' },
    { role: 'staff', label: 'Resepsionis', total: count('staff'), desc: 'Operasional, tanpa laporan', dot: 'bg-amber-500' },
  ]
})

/** Dokter yang belum punya akun + dokter milik user yang sedang diedit */
const doctorOptions = computed(() => {
  const linked = new Set(users.value.filter((u) => u.doctor_id).map((u) => Number(u.doctor_id)))
  const currentId = editing.value?.doctor_id ? Number(editing.value.doctor_id) : null

  return doctors.value
    .filter((d) => !linked.has(Number(d.id)) || Number(d.id) === currentId)
    .map((d) => ({ value: Number(d.id), label: d.name }))
})

async function load() {
  loading.value = true
  try {
    const [u, d] = await Promise.all([api.get('/users'), api.get('/doctors')])
    users.value = u
    doctors.value = d
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

const blank = () => ({ name: '', email: '', role: 'staff', doctor_id: '', password: '' })
const form = ref(blank())

function openCreate() {
  editing.value = null
  errors.value = {}
  form.value = blank()
  modal.value = true
}

function openEdit(u) {
  editing.value = u
  errors.value = {}
  form.value = {
    name: u.name,
    email: u.email,
    role: u.role,
    doctor_id: u.doctor_id ?? '',
    password: '',
  }
  modal.value = true
}

async function save() {
  errors.value = {}
  const f = form.value

  if (!f.name.trim()) errors.value.name = 'Nama wajib diisi.'
  if (!f.email.trim()) errors.value.email = 'Email wajib diisi.'
  if (!editing.value && String(f.password).length < 6) {
    errors.value.password = 'Password minimal 6 karakter.'
  }
  if (f.role === 'doctor' && !f.doctor_id) {
    errors.value.doctor_id = 'Pilih dokter yang akan ditautkan.'
  }
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const payload = {
      name: f.name.trim(),
      email: f.email.trim(),
      role: f.role,
      doctor_id: f.role === 'doctor' ? Number(f.doctor_id) : null,
    }

    if (editing.value) {
      await api.put(`/users/${editing.value.id}`, payload)
      toast.success('User diperbarui.')

      // Jika yang diubah adalah akun sendiri, segarkan sesi
      if (editing.value.id === me.value?.id) {
        const fresh = await api.get('/auth/me')
        setUser(fresh.user)
      }
    } else {
      await api.post('/users', { ...payload, password: f.password })
      toast.success('User ditambahkan.')
    }

    modal.value = false
    await load()
    auditRows.value = [] // jejak berubah, muat ulang saat tab dibuka
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

// ---- ganti password ----
const pwdTarget = ref(null)
const newPassword = ref('')
const pwdError = ref('')
const savingPwd = ref(false)

function openPassword(u) {
  pwdTarget.value = u
  newPassword.value = ''
  pwdError.value = ''
}

async function savePassword() {
  pwdError.value = ''
  if (String(newPassword.value).length < 6) {
    pwdError.value = 'Password minimal 6 karakter.'
    return
  }
  savingPwd.value = true
  try {
    await api.patch(`/users/${pwdTarget.value.id}/password`, { password: newPassword.value })
    toast.success('Password diperbarui.')
    pwdTarget.value = null
  } catch (e) {
    toast.error(e.message)
  } finally {
    savingPwd.value = false
  }
}

// ---- hapus ----
const deleting = ref(null)
const askDelete = (u) => (deleting.value = u)

async function confirmDelete() {
  try {
    await api.del(`/users/${deleting.value.id}`)
    toast.success('User dihapus.')
    deleting.value = null
    await load()
    auditRows.value = []
  } catch (e) {
    toast.error(e.message)
    deleting.value = null
  }
}

// ---- jejak aktivitas ----
const auditHeaders = ['Aksi', 'Pelaku', 'Entitas', 'Endpoint', 'Waktu']
const auditRows = ref([])
const auditSummary = ref([])
const auditLoading = ref(false)
const auditSearch = ref('')
const auditAction = ref('')

const auditFiltered = computed(() => {
  const q = auditSearch.value.toLowerCase().trim()
  return auditRows.value.filter((a) => {
    const matchQ =
      !q ||
      (a.user_name || '').toLowerCase().includes(q) ||
      a.path.toLowerCase().includes(q)
    const matchA = !auditAction.value || a.action === auditAction.value
    return matchQ && matchA
  })
})

const ACTION_LABELS = {
  LOGIN: 'Login',
  POST: 'Tambah',
  PUT: 'Ubah',
  PATCH: 'Ubah',
  DELETE: 'Hapus',
}

const actionLabel = (a) => ACTION_LABELS[a] ?? a
const actionTone = (a) =>
  ({ LOGIN: 'accent', POST: 'success', PUT: 'info', PATCH: 'warning', DELETE: 'danger' })[a] ?? 'neutral'

const ENTITY_LABELS = {
  users: 'Akun',
  patients: 'Pasien',
  doctors: 'Dokter',
  departments: 'Departemen',
  appointments: 'Appointment',
  medical_records: 'Rekam Medis',
  invoices: 'Invoice',
  auth: 'Autentikasi',
}
const entityLabel = (e) => ENTITY_LABELS[e] ?? e

const auditSummaryCards = computed(() => {
  const total = (a) => auditSummary.value.find((x) => x.action === a)?.total ?? 0
  return [
    { action: 'POST', label: 'Tambah', total: total('POST'), dot: 'bg-emerald-500' },
    { action: 'PUT', label: 'Ubah', total: total('PUT') + total('PATCH'), dot: 'bg-sky-500' },
    { action: 'DELETE', label: 'Hapus', total: total('DELETE'), dot: 'bg-rose-500' },
    {
      action: 'ALL',
      label: 'Total Aksi',
      total: auditSummary.value.reduce((s, x) => s + Number(x.total), 0),
      dot: 'bg-[#188C85]',
    },
  ]
})

async function loadAudit() {
  auditLoading.value = true
  try {
    const [rows, summary] = await Promise.all([api.get('/audit?limit=200'), api.get('/audit/summary')])
    auditRows.value = rows
    auditSummary.value = summary
  } catch (e) {
    toast.error(e.message)
  } finally {
    auditLoading.value = false
  }
}

function switchTab(key) {
  tab.value = key
  if (key === 'jejak' && !auditRows.value.length) loadAudit()
}

onMounted(load)
</script>
