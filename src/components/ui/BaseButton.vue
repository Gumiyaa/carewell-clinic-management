<template>
  <button
    class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap"
    :class="variantClass"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost
})

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-dark shadow-[0_4px_12px_rgba(24,140,133,0.28)]',
  secondary: 'bg-white text-gray-700 border border-[#E8EDF2] hover:bg-neutral-light',
  ghost: 'text-gray-600 hover:bg-neutral-light',
}

const variantClass = computed(() => variants[props.variant] ?? variants.primary)
</script>
