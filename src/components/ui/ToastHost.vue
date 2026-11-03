<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[320px] pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="t in state.items"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg bg-white"
        :class="borderClass(t.type)"
      >
        <div class="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5" :class="iconBg(t.type)">
          <svg v-if="t.type === 'success'" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
          <svg v-else-if="t.type === 'error'" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <svg v-else class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M12 8h.01M12 12v5" />
          </svg>
        </div>
        <p class="flex-1 text-[12.5px] text-gray-700 leading-relaxed">{{ t.message }}</p>
        <button class="text-gray-400 hover:text-gray-600 shrink-0" @click="remove(t.id)">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../../lib/toast.js'

const { state, remove } = useToast()

const borderClass = (t) =>
  ({ success: 'border-emerald-200', error: 'border-rose-200', info: 'border-sky-200' })[t] ?? 'border-gray-200'

const iconBg = (t) =>
  ({ success: 'bg-emerald-500', error: 'bg-rose-500', info: 'bg-sky-500' })[t] ?? 'bg-gray-500'
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
