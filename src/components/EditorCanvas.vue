<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { PREVIEW_MAX_SIZE, renderToCanvas } from '@/composables/useImageRenderer'

const store = useEditorStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)
let rafId = 0

function render(): void {
  const canvas = canvasEl.value
  if (!canvas || !store.source) return
  renderToCanvas(canvas, store.source, store.operations, { maxSize: PREVIEW_MAX_SIZE })
}

// Coalesce rapid slider updates into one render per animation frame.
function scheduleRender(): void {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    render()
  })
}

// Source identity changes only on new image load — shallow watch is enough.
watch(() => store.source, scheduleRender)
// Operations array mutates in place, so deep watch is required.
watch(() => store.operations, scheduleRender, { deep: true })

onMounted(render)
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="preview">
    <canvas ref="canvasEl" class="preview__canvas" />
  </div>
</template>

<style scoped>
.preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.preview__canvas {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  /* Checkerboard pattern to visualise PNG transparency.
     Colors adapt to the active Vuetify theme via CSS variables. */
  background-color: rgb(var(--v-theme-surface));
  background-image:
    linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.07) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.07) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.07) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.07) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
}
</style>
