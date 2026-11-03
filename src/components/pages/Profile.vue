<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <PageHeader title="Profil Saya" subtitle="Kelola informasi akun dan keamanan Anda." />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Kartu identitas -->
      <Card body-class="p-5">
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-accent text-white grid place-items-center text-[20px] font-bold mx-auto">
            {{ userInitials }}
          </div>
          <p class="text-[15px] font-semibold text-gray-900 mt-3">{{ user?.name }}</p>
          <p class="text-[12px] text-gray-500">{{ user?.email }}</p>
          <div class="mt-2 flex justify-center">
            <Badge :label="roleLabel(user?.role)" :tone="roleTone" />
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-[#F1F5F9] space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[12px] text-gray-500">Modul diizinkan</span>
            <span class="text-[12px] font-semibold text-gray-800">{{ permissions.length }}</span>
          </div>
          <div v-if="isScopedDoctor" class="flex items-start justify-between gap-3">
            <span class="text-[12px] text-gray-500 shrink-0">Data dokter</span>
            <span class="text-[12px] font-semibold text-emerald-600 text-right">Tertaut</span>
          </div>
          <div v-else-if="user?.role === 'doctor'" class="flex items-start justify-between gap-3">
            <span class="text-[12px] text-gray-500 shrink-0">Data dokter</span>
            <span class="text-[12px] font-semibold text-rose-600 text-right">Belum tertaut</span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-[#F1F5F9]">
          <p class="text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-400 mb-2">Akses modul</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="p in permissions"
              :key="p"
              class="text-[10.5px] font-medium px-2 py-1 rounded-md bg-[#E6F4F3] text-[#12736D]"
            >
              {{ moduleLabel(p) }}
            </span>
          </div>
        </div>
      </Card>

      <!-- Form -->
      <div class="lg:col-span-2 space-y-4">
        <Card title="Informasi Akun" subtitle="Perubahan langsung tersimpan ke akun Anda." body-class="p-5">
          <form class="grid grid-cols-1 sm:grid-cols-2 gap-3.5" @submit.prevent="saveProfile">
            <div class="sm:col-span-2">
              <TextField v-model="profile.name" label="Nama Lengkap" required :error="profileErrors.name" />
            </div>
            <TextField :model-value="user?.email" label="Email" disabled hint="Email hanya dapat diubah oleh admin." />
            <TextField :model-value="roleLabel(user?.role)" label="Role" disabled hint="Role ditentukan oleh admin." />
            <div class="sm:col-span-2 flex justify-end pt-1">
              <BaseButton :disabled="savingProfile || !profileDirty" @click="saveProfile">
                {{ savingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </BaseButton>
            </div>
          </form>
        </Card>

        <Card title="Keamanan" subtitle="Ganti password akun Anda." body-class="p-5">
          <form class="grid grid-cols-1 sm:grid-cols-2 gap-3.5" @submit.prevent="savePassword">
            <div class="sm:col-span-2">
              <TextField
                v-model="pwd.current"
                label="Password Saat Ini"
                type="password"
                required
                :error="pwdErrors.current"
              />
            </div>
            <TextField
              v-model="pwd.next"
              label="Password Baru"
              type="password"
              required
              hint="Minimal 6 karakter."
              :error="pwdErrors.next"
            />
            <TextField
              v-model="pwd.confirm"
              label="Ulangi Password Baru"
              type="password"
              required
              :error="pwdErrors.confirm"
            />
            <div class="sm:col-span-2 flex justify-end pt-1">
              <BaseButton :disabled="savingPwd" @click="savePassword">
                {{ savingPwd ? 'Menyimpan...' : 'Ganti Password' }}
              </BaseButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import PageHeader from '../ui/PageHeader.vue'
import BaseButton from '../ui/BaseButton.vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'
import TextField from '../ui/TextField.vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../lib/toast.js'
import { useAuth, roleLabel } from '../../lib/auth.js'
import { initials } from '../../lib/format.js'

const toast = useToast()
const { state, permissions, isScopedDoctor, setUser } = useAuth()

const user = computed(() => state.user)
const userInitials = computed(() => initials(user.value?.name || 'GU'))
const roleTone = computed(() => ({ admin: 'success', doctor: 'info', staff: 'warning' })[user.value?.role] ?? 'neutral')

const moduleLabel = (m) =>
  ({
    dashboard: 'Dashboard',
    patients: 'Patients',
    appointments: 'Appointments',
    doctors: 'Doctors',
    departments: 'Departments',
    records: 'Rekam Medis',
    billing: 'Billing',
    reports: 'Reports',
    users: 'Users',
  })[m] ?? m

// ---- profil ----
const profile = ref({ name: '' })
const profileErrors = ref({})
const savingProfile = ref(false)

const profileDirty = computed(() => profile.value.name.trim() !== (user.value?.name ?? ''))

watch(
  user,
  (u) => {
    if (u) profile.value.name = u.name
  },
  { immediate: true }
)

async function saveProfile() {
  profileErrors.value = {}
  if (!profile.value.name.trim()) {
    profileErrors.value.name = 'Nama wajib diisi.'
    return
  }

  savingProfile.value = true
  try {
    const res = await api.patch('/auth/profile', { name: profile.value.name.trim() })
    setUser(res.user)
    toast.success('Profil diperbarui.')
  } catch (e) {
    toast.error(e.message)
  } finally {
    savingProfile.value = false
  }
}

// ---- password ----
const pwd = ref({ current: '', next: '', confirm: '' })
const pwdErrors = ref({})
const savingPwd = ref(false)

async function savePassword() {
  pwdErrors.value = {}
  if (!pwd.value.current) pwdErrors.value.current = 'Password saat ini wajib diisi.'
  if (String(pwd.value.next).length < 6) pwdErrors.value.next = 'Minimal 6 karakter.'
  if (pwd.value.next !== pwd.value.confirm) pwdErrors.value.confirm = 'Konfirmasi tidak cocok.'
  if (Object.keys(pwdErrors.value).length) return

  savingPwd.value = true
  try {
    await api.patch('/auth/password', {
      current_password: pwd.value.current,
      new_password: pwd.value.next,
    })
    toast.success('Password berhasil diganti.')
    pwd.value = { current: '', next: '', confirm: '' }
  } catch (e) {
    toast.error(e.message)
  } finally {
    savingPwd.value = false
  }
}

onMounted(async () => {
  // Pastikan data user terbaru saat halaman dibuka
  try {
    const res = await api.get('/auth/me')
    setUser(res.user)
  } catch {
    /* diamkan: api.js sudah menangani 401 */
  }
})
</script>
