<template>
  <teleport to="body">
    <transition name="confirm">
      <div v-if="open" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0" style="background-color: rgba(23, 43, 77, 0.45)" @click="$emit('cancel')" />
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5">
          <div class="w-10 h-10 rounded-full grid place-items-center mb-3" :class="danger ? 'bg-rose-50' : 'bg-amber-50'">
            <svg class="w-5 h-5" :class="danger ? 'text-rose-500' : 'text-amber-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <h3 class="text-[15px] font-semibold text-gray-900">{{ title }}</h3>
          <p class="text-[12.5px] text-gray-500 mt-1 leading-relaxed">{{ message }}</p>
          <div class="flex justify-end gap-2 mt-5">
            <button class="h-9 px-4 rounded-lg border border-[#E8EDF2] text-[12.5px] font-semibold text-gray-700 hover:bg-neutral-light" @click="$emit('cancel')">
              Batal
            </button>
            <button
              class="h-9 px-4 rounded-lg text-[12.5px] font-semibold text-white transition-colors"
              :class="danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-accent hover:bg-accent-dark'"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              {{ loading ? 'Memproses...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: { type: String, default: 'Konfirmasi' },
  message: String,
  confirmText: { type: String, default: 'Ya, lanjutkan' },
  danger: { type: Boolean, default: true },
  loading: Boolean,
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.16s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
