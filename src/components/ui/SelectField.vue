<template>
  <label class="block">
    <span v-if="label" class="block text-[12px] font-medium text-gray-700 mb-1.5">
      {{ label }}<span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </span>

    <select
      :value="modelValue"
      :disabled="disabled"
      class="w-full h-10 px-3 rounded-lg bg-white border border-[#E8EDF2] text-[13px] text-gray-800 outline-none focus:border-accent disabled:bg-neutral-light disabled:text-gray-400 transition-colors"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ placeholder || 'Pilih...' }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <span v-if="error" class="block text-[11px] text-rose-600 mt-1">{{ error }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  options: { type: Array, default: () => [] },
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
})
defineEmits(['update:modelValue'])
</script>
