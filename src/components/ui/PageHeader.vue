<template>
  <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div class="min-w-0">
      <div class="flex items-center gap-2 text-[12px] text-gray-500 mb-1.5">
        <span>Carewell</span>
        <span class="text-gray-300">/</span>
        <span class="text-gray-700 font-medium">{{ title }}</span>
      </div>
      <h1 class="text-[26px] font-bold text-gray-900 tracking-tight leading-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-[13px] text-gray-500 mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: String,
})
</script>
