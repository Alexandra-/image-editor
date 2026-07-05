<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const inputEl = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref('')

function openPicker(): void {
  inputEl.value?.click()
}

async function accept(file: File | undefined | null): Promise<void> {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please choose an image file.'
    return
  }
  errorMessage.value = ''
  try {
    await store.loadImage(file)
  } catch {
    errorMessage.value = 'Failed to load image. Please try another file.'
  }
}

async function onInputChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  await accept(file)
}

function onDragEnter(): void {
  isDragging.value = true
  errorMessage.value = ''
}

function onDragLeave(event: DragEvent): void {
  // Ignore dragleave events caused by moving into a child element — only treat it
  // as a real leave when the pointer moves outside the uploader boundary entirely.
  const related = event.relatedTarget as Node | null
  if (related && (event.currentTarget as HTMLElement).contains(related)) return
  isDragging.value = false
}

async function onDrop(event: DragEvent): Promise<void> {
  isDragging.value = false
  await accept(event.dataTransfer?.files?.[0])
}
</script>

<template>
  <div
    class="uploader"
    :class="{ 'uploader--drag': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <v-icon icon="mdi-image-plus" size="72" class="uploader__icon" />
    <div class="text-h6 mb-1">Drag &amp; drop an image here</div>
    <div class="text-body-2 text-medium-emphasis mb-5">or</div>
    <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" @click="openPicker">
      Choose file
    </v-btn>

    <div v-if="errorMessage" class="text-error text-body-2 mt-4">{{ errorMessage }}</div>

    <input
      ref="inputEl"
      type="file"
      accept="image/*"
      class="uploader__input"
      @change="onInputChange"
    />
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: min(560px, 80%);
  height: min(360px, 70%);
  padding: 32px;
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.uploader--drag {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}

.uploader__icon {
  color: rgb(var(--v-theme-primary));
  margin-bottom: 16px;
}

.uploader__input {
  display: none;
}
</style>
