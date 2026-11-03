<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0" style="background-color: rgba(23, 43, 77, 0.45)" @click="$emit('close')" />
        <div
          class="relative w-full bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
          :class="widthClass"
        >
          <div class="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#E8EDF2] shrink-0">
            <div class="min-w-0">
              <h3 class="text-[15px] font-semibold text-gray-900">{{ title }}</h3>
              <p v-if="subtitle" class="text-[12px] text-gray-500 mt-0.5">{{ subtitle }}</p>
            </div>
            <button class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-neutral-light shrink-0" @click="$emit('close')">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-5 py-4 overflow-y-auto flex-1">
            <slot />
          </div>

          <div v-if="$slots.footer" class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#E8EDF2] bg-neutral-light/50 rounded-b-2xl shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: Boolean,
  title: String,
  subtitle: String,
  size: { type: String, default: 'md' }, // sm | md | lg
})
defineEmits(['close'])

const widthClass = computed(
  () => ({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' })[props.size] ?? 'max-w-lg'
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.16s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active > div:last-child {
  transition: transform 0.16s ease;
}
.modal-enter-from > div:last-child {
  transform: scale(0.97);
}
</style>
