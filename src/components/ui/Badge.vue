<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
    :class="toneClass"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  tone: { type: String, default: 'neutral' }, // success | warning | danger | info | neutral | accent
})

const tones = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  accent: 'bg-[#E6F4F3] text-[#12736D]',
  neutral: 'bg-slate-100 text-slate-600',
}

const dots = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  accent: 'bg-accent',
  neutral: 'bg-slate-400',
}

const toneClass = computed(() => tones[props.tone] ?? tones.neutral)
const dotClass = computed(() => dots[props.tone] ?? dots.neutral)
</script>
