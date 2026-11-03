<template>
  <div class="flex items-center gap-3 h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] focus-within:border-accent transition-colors">
    <svg class="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="flex-1 min-w-0 bg-transparent text-[13px] text-gray-800 placeholder-text-muted outline-none"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      v-if="modelValue"
      class="text-text-muted hover:text-gray-600 shrink-0"
      @click="$emit('update:modelValue', '')"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: { type: String, default: 'Search...' },
})
defineEmits(['update:modelValue'])
</script>
