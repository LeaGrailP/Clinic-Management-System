<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  readonly: { type: Boolean, default: false },
  type: { type: String, default: 'text' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative">
    <input
      :type="type"
      :readonly="readonly"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"

      class="peer block w-full rounded-lg border 
            border-slate-400 bg-slate-50 
            text-slate-800 
            focus:outline-none focus:ring-0

            dark:bg-slate-800 dark:border-slate-600 
            dark:text-slate-100"
    />

    <label
      class="absolute left-3 -top-2 text-xs 
            text-slate-800 bg-slate-50 px-1 transition-all

            peer-focus:-top-2 peer-focus:text-xs
            peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm

            dark:text-slate-100 dark:bg-slate-800"
    >
      {{ label }}
    </label>
  </div>
</template>