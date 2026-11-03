<template>
  <label class="block">
    <span v-if="label" class="block text-[12px] font-medium text-gray-700 mb-1.5">
      {{ label }}<span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </span>

    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :step="step"
      class="w-full h-10 px-3 rounded-lg bg-white border text-[13px] text-gray-800 placeholder-text-muted outline-none focus:border-accent disabled:bg-neutral-light disabled:text-gray-400 transition-colors"
      :class="error ? 'border-rose-300' : 'border-[#E8EDF2]'"
      @input="$emit('update:modelValue', type === 'number' ? Number($event.target.value) : $event.target.value)"
    />

    <span v-if="error" class="block text-[11px] text-rose-600 mt-1">{{ error }}</span>
    <span v-else-if="hint" class="block text-[11px] text-gray-400 mt-1">{{ hint }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  hint: String,
  min: [String, Number],
  step: [String, Number],
})
defineEmits(['update:modelValue'])
</script>
