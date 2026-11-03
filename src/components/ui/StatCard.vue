<template>
  <div class="bg-white rounded-xl border border-[#E8EDF2] p-5 hover:border-accent/30 transition-colors">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[12px] font-medium text-gray-500">{{ label }}</p>
        <p class="text-[26px] font-bold text-gray-900 leading-none mt-2 tracking-tight">{{ value }}</p>
      </div>
      <div class="w-10 h-10 rounded-lg grid place-items-center shrink-0" :class="iconBg">
        <component :is="icon" class="w-5 h-5" :class="iconColor" />
      </div>
    </div>
    <div class="flex items-center gap-1.5 mt-3.5">
      <span v-if="delta" class="inline-flex items-center gap-0.5 text-[11px] font-semibold" :class="deltaClass">
        <svg v-if="delta.startsWith('+')" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="m6 15 6-6 6 6" />
        </svg>
        {{ delta }}
      </span>
      <span class="text-[11px] text-gray-400">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: String,
  hint: String,
  delta: String,
  tone: { type: String, default: 'accent' }, // accent | info | success | warning
  icon: [Object, Function],
})

const map = {
  accent: { bg: 'bg-[#E6F4F3]', fg: 'text-accent' },
  info: { bg: 'bg-sky-50', fg: 'text-sky-600' },
  success: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  warning: { bg: 'bg-amber-50', fg: 'text-amber-600' },
}

const iconBg = computed(() => (map[props.tone] ?? map.accent).bg)
const iconColor = computed(() => (map[props.tone] ?? map.accent).fg)
const deltaClass = computed(() =>
  props.delta?.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'
)
</script>
