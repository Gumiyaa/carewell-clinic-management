<template>
  <div class="bg-white rounded-xl border border-[#E8EDF2]">
    <!-- Header: hanya render kalau ada judul atau actions -->
    <div
      v-if="title || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E8EDF2]"
      :class="{ 'sm:flex-nowrap': !!title }"
    >
      <div v-if="title" class="min-w-0">
        <h3 class="text-[15px] font-semibold text-gray-900 leading-tight">{{ title }}</h3>
        <p v-if="subtitle" class="text-[12px] text-gray-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <div v-else class="text-[13px] font-semibold text-gray-900">{{ subtitle }}</div>
      <div class="shrink-0 ml-auto"><slot name="actions" /></div>
    </div>
    <div :class="bodyClass">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  bodyClass: { type: String, default: 'p-5' },
})
</script>
