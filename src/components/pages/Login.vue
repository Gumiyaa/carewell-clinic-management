<template>
  <div class="min-h-screen flex">
    <!-- Left: brand panel -->
    <div class="hidden lg:flex w-[46%] bg-sidebar relative overflow-hidden flex-col justify-between p-10">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
      <div class="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent grid place-items-center">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div>
          <p class="text-white font-semibold text-[16px] leading-tight">Carewell</p>
          <p class="text-[11px] text-[#8DA0BC]">Clinic Management</p>
        </div>
      </div>

      <div class="relative">
        <h1 class="text-white text-[32px] font-bold leading-tight tracking-tight">
          Kelola klinik<br />lebih efisien.
        </h1>
        <p class="text-[#9FB0C9] text-[13.5px] mt-3 leading-relaxed max-w-sm">
          Satu platform untuk pasien, jadwal dokter, rekam medis, dan pembayaran.
        </p>

        <div class="mt-8 space-y-3">
          <div v-for="f in features" :key="f" class="flex items-center gap-2.5">
            <div class="w-5 h-5 rounded-full bg-accent/20 grid place-items-center shrink-0">
              <svg class="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <span class="text-[12.5px] text-[#C7D3E3]">{{ f }}</span>
          </div>
        </div>
      </div>

      <p class="relative text-[11px] text-[#6B7F9E]">© 2026 Carewell. All rights reserved.</p>
    </div>

    <!-- Right: form -->
    <div class="flex-1 flex items-center justify-center p-6 bg-white">
      <div class="w-full max-w-[380px]">
        <div class="lg:hidden flex items-center gap-2.5 mb-8">
          <div class="w-9 h-9 rounded-xl bg-accent grid place-items-center">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div>
            <p class="text-gray-900 font-semibold text-[15px] leading-tight">Carewell</p>
            <p class="text-[10px] text-gray-500">Clinic Management</p>
          </div>
        </div>

        <h2 class="text-[24px] font-bold text-gray-900 tracking-tight">Masuk ke akun</h2>
        <p class="text-[13px] text-gray-500 mt-1">Gunakan kredensial klinik Anda.</p>

        <form class="mt-7 space-y-4" @submit.prevent="submit">
          <TextField v-model="email" label="Email" type="email" placeholder="admin@carewell.test" required />
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[12px] font-medium text-gray-700">Password<span class="text-rose-500 ml-0.5">*</span></span>
              <button
                type="button"
                class="text-[11px] text-accent hover:underline font-medium"
                @click="showReset = !showReset"
              >
                Lupa password?
              </button>
            </div>
            <div class="relative">
              <input
                v-model="password"
                :type="show ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full h-10 px-3 pr-10 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-800 outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                @click="show = !show"
              >
                <svg v-if="!show" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.4M6.6 6.6A17 17 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8" />
                  <path d="M2 2l20 20" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="showReset" class="rounded-lg bg-[#E6F4F3] border border-[#BFE3E0] px-3 py-2.5">
            <p class="text-[11.5px] text-[#12736D] leading-relaxed">
              Password tidak dapat direset sendiri. Hubungi <span class="font-semibold">Clinic Admin</span> —
              admin dapat mengatur ulang password Anda lewat menu <span class="font-semibold">Users</span>.
            </p>
          </div>

          <div v-if="error" class="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5">
            <p class="text-[12px] text-rose-700">{{ error }}</p>
          </div>

          <button
            type="submit"
            class="w-full h-10 rounded-lg bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <div class="mt-6 rounded-lg bg-neutral-light border border-[#E8EDF2] px-3.5 py-3">
          <p class="text-[11px] font-semibold text-gray-600 mb-1.5">Akun demo · password <span class="font-mono">admin123</span></p>
          <div class="space-y-1">
            <p v-for="a in demoAccounts" :key="a.email" class="text-[11px] text-gray-500 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="a.dot" />
              <span class="font-mono">{{ a.email }}</span>
              <span class="text-gray-400">· {{ a.role }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../lib/auth.js'
import TextField from '../ui/TextField.vue'

const router = useRouter()
const { login } = useAuth()

const email = ref('admin@carewell.test')
const password = ref('admin123')
const show = ref(false)
const showReset = ref(false)
const loading = ref(false)
const error = ref('')

const features = ['Data pasien terpusat', 'Jadwal dokter real-time', 'Rekam medis digital', 'Invoice otomatis']

const demoAccounts = [
  { email: 'admin@carewell.test', role: 'Admin', dot: 'bg-emerald-500' },
  { email: 'sarah@carewell.test', role: 'Dokter', dot: 'bg-sky-500' },
  { email: 'staff@carewell.test', role: 'Resepsionis', dot: 'bg-amber-500' },
]

async function submit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Email dan password wajib diisi.'
    return
  }
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
