<script setup lang="ts">
import { useTheme } from 'vuetify'
import { useEditorStore } from '@/stores/editor'
import { exportBlob } from '@/composables/useImageRenderer'
import { downloadBlob, downloadJson, extForMime, splitFilename } from '@/utils/download'
import ReplaceImageDialog from './ReplaceImageDialog.vue'

const store = useEditorStore()

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
function toggleTheme(): void {
  theme.global.name.value = isDark.value ? 'editorLight' : 'editorDark'
}

const fileInput = ref<HTMLInputElement | null>(null)
const showReplaceDialog = ref(false)
const isExporting = ref(false)
const snackbarVisible = ref(false)
const snackbarMessage = ref('')
let pendingFile: File | null = null

function showError(message: string): void {
  snackbarMessage.value = message
  snackbarVisible.value = true
}

function triggerUpload(): void {
  fileInput.value?.click()
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (store.hasImage) {
    pendingFile = file
    showReplaceDialog.value = true
  } else {
    try {
      await store.loadImage(file)
    } catch {
      showError('Failed to load image. Please try another file.')
    }
  }
}

async function confirmReplace(): Promise<void> {
  showReplaceDialog.value = false
  if (pendingFile) {
    try {
      await store.loadImage(pendingFile)
    } catch {
      showError('Failed to load image. Please try another file.')
    } finally {
      pendingFile = null
    }
  }
}

function cancelReplace(): void {
  showReplaceDialog.value = false
  pendingFile = null
}

async function downloadImage(): Promise<void> {
  if (!store.source) return
  isExporting.value = true
  try {
    const blob = await exportBlob(store.source, store.operations)
    const { base } = splitFilename(store.source.name)
    downloadBlob(blob, `${base}-edited.${extForMime(blob.type)}`)
  } catch {
    showError('Export failed. Please try again.')
  } finally {
    isExporting.value = false
  }
}

function exportOperations(): void {
  if (!store.source) return
  try {
    const { base } = splitFilename(store.source.name)
    downloadJson(store.toProject(), `${base}-operations.json`)
  } catch {
    showError('Failed to export operations. Please try again.')
  }
}
</script>

<template>
  <div class="toolbar">
    <v-btn prepend-icon="mdi-upload" @click="triggerUpload">Upload</v-btn>

    <v-btn
      prepend-icon="mdi-tune"
      :active="store.isEditPanelOpen"
      :variant="store.isEditPanelOpen ? 'tonal' : 'text'"
      :color="store.isEditPanelOpen ? 'primary' : undefined"
      :disabled="!store.hasImage"
      @click="store.toggleEditPanel()"
    >
      Edit
    </v-btn>

    <v-divider vertical class="mx-1" />

    <v-btn prepend-icon="mdi-restore" :disabled="!store.hasEdits" @click="store.reset()">
      Reset
    </v-btn>

    <v-btn
      prepend-icon="mdi-download"
      :disabled="!store.hasImage"
      :loading="isExporting"
      @click="downloadImage"
    >
      Download image
    </v-btn>

    <v-btn
      prepend-icon="mdi-code-json"
      :disabled="!store.hasEdits"
      @click="exportOperations"
    >
      Export operations
    </v-btn>

    <v-btn
      icon="mdi-theme-light-dark"
      :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
      class="toolbar__theme-btn"
      @click="toggleTheme"
    />

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="toolbar__input"
      @change="onFileChange"
    />

    <ReplaceImageDialog
      :model-value="showReplaceDialog"
      @confirm="confirmReplace"
      @cancel="cancelReplace"
    />

    <v-snackbar v-model="snackbarVisible" color="error" :timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar__input {
  display: none;
}

.toolbar__theme-btn {
  margin-left: 8px;
}
</style>
