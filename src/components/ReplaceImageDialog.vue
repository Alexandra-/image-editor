<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6">Replace image?</v-card-title>
      <v-card-text>
        Loading a new image will discard all current edits. This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('cancel')">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="emit('confirm')">Replace</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
