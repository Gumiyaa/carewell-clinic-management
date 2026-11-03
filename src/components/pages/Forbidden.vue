<template>
  <div class="px-6 lg:px-8 py-6 lg:py-7">
    <div class="max-w-md mx-auto mt-10 text-center">
      <div class="w-14 h-14 rounded-full bg-rose-50 grid place-items-center mx-auto mb-4">
        <svg class="w-7 h-7 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h1 class="text-[20px] font-bold text-gray-900">Akses ditolak</h1>
      <p class="text-[13px] text-gray-500 mt-2 leading-relaxed">
        Role Anda (<span class="font-semibold text-gray-700">{{ label }}</span>) tidak punya izin membuka
        halaman ini. Hubungi admin klinik bila Anda merasa ini keliru.
      </p>
      <div class="flex items-center justify-center gap-2 mt-6">
        <BaseButton variant="secondary" @click="$router.back()">Kembali</BaseButton>
        <BaseButton @click="$router.push('/dashboard')">Ke Dashboard</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import { useAuth, roleLabel } from '../../lib/auth.js'

const { role } = useAuth()
const label = computed(() => roleLabel(role.value))
</script>
