<template>
  <label class="block">
    <span v-if="label" class="block text-[12px] font-medium text-gray-700 mb-1.5">
      {{ label }}<span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </span>

    <textarea
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-3 py-2.5 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-800 placeholder-text-muted outline-none focus:border-accent disabled:bg-neutral-light resize-y transition-colors"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <span v-if="error" class="block text-[11px] text-rose-600 mt-1">{{ error }}</span>
    <span v-else-if="hint" class="block text-[11px] text-gray-400 mt-1">{{ hint }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: String,
  label: String,
  rows: { type: Number, default: 3 },
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  hint: String,
})
defineEmits(['update:modelValue'])
</script>
