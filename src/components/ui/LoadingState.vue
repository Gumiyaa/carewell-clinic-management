<template>
  <div class="flex items-center justify-center py-14">
    <div class="flex flex-col items-center gap-2.5">
      <svg class="w-6 h-6 text-accent animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-20" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      </svg>
      <p class="text-[12px] text-gray-500">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ text: { type: String, default: 'Memuat data...' } })
</script>
