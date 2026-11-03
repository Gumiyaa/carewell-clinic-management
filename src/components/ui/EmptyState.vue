<template>
  <div class="flex flex-col items-center justify-center py-14 px-4 text-center">
    <div class="w-12 h-12 rounded-full bg-neutral-light grid place-items-center mb-3">
      <svg class="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 13V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6" />
        <path d="M4 13h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" />
        <path d="M9 13v4h6v-4" />
      </svg>
    </div>
    <p class="text-[13px] font-medium text-gray-700">{{ title }}</p>
    <p v-if="description" class="text-[12px] text-gray-500 mt-1 max-w-xs">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Belum ada data' },
  description: String,
})
</script>
