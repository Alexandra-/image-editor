<script setup lang="ts">
import type { CropperImage, CropperSelection } from 'cropperjs'
import { useEditorStore } from '@/stores/editor'
import { buildFilterString } from '@/composables/useImageRenderer'

const store = useEditorStore()
const imageEl = ref<CropperImage | null>(null)
const selectionEl = ref<CropperSelection | null>(null)
const selectionError = ref('')

/**
 * Cropper.js selection coordinates live in the canvas coordinate space. The image
 * transform matrix (natural -> canvas) lets us convert them back to the original's
 * natural pixels, which is what we store so the crop is reproducible.
 */
function readTransform(): [number, number, number, number] {
  const matrix = imageEl.value?.$getTransform() ?? [1, 0, 0, 1, 0, 0]
  const [a, , , d, e, f] = matrix
  return [a, d, e, f]
}

function applyFilterPreview(): void {
  if (imageEl.value) {
    imageEl.value.style.filter = buildFilterString(store.operations)
  }
}

onMounted(async () => {
  const image = imageEl.value
  const selection = selectionEl.value
  if (!image || !selection || !store.source) return

  // Crop only selects a region; the image itself should not move/zoom/rotate,
  // which keeps the natural-pixel mapping simple and predictable.
  image.rotatable = false
  image.scalable = false
  image.skewable = false
  image.translatable = false

  applyFilterPreview()

  await image.$ready()

  const crop = store.cropOperation
  if (crop) {
    const [a, d, e, f] = readTransform()
    selection.$change(crop.x * a + e, crop.y * d + f, crop.width * a, crop.height * d)
  }
})

// Re-apply the filter preview only when adjustment operations change.
// Crop operations are geometry-only and have no effect on ctx.filter.
watch(
  () => store.operations.filter((op) => op.type !== 'crop'),
  applyFilterPreview,
  { deep: true },
)

function apply(): void {
  const image = imageEl.value
  const selection = selectionEl.value
  if (!image || !selection || !store.source) {
    store.cancelCrop()
    return
  }

  const [a, d, e, f] = readTransform()
  const sw = store.source.width
  const sh = store.source.height

  let x = (selection.x - e) / a
  let y = (selection.y - f) / d
  let width = selection.width / a
  let height = selection.height / d

  x = Math.max(0, Math.min(x, sw))
  y = Math.max(0, Math.min(y, sh))
  width = Math.min(width, sw - x)
  height = Math.min(height, sh - y)

  // Reject empty/degenerate selections with visible feedback instead of silently closing.
  if (width < 1 || height < 1) {
    selectionError.value = 'Please draw a selection before applying crop.'
    return
  }

  selectionError.value = ''
  store.setCrop({
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  })
  store.cancelCrop()
}

function cancel(): void {
  store.cancelCrop()
}
</script>

<template>
  <div class="crop-tool">
    <div class="crop-tool__stage">
      <cropper-canvas background class="crop-tool__canvas">
        <cropper-image ref="imageEl" :src="store.source?.objectUrl" alt="Image to crop" />
        <cropper-shade />
        <cropper-handle action="select" plain />
        <cropper-selection ref="selectionEl" initial-coverage="0.8" movable resizable outlined>
          <cropper-grid role="grid" covered />
          <cropper-crosshair centered />
          <cropper-handle action="move" theme-color="rgba(0, 0, 0, 0.2)" />
          <cropper-handle action="n-resize" />
          <cropper-handle action="e-resize" />
          <cropper-handle action="s-resize" />
          <cropper-handle action="w-resize" />
          <cropper-handle action="ne-resize" />
          <cropper-handle action="nw-resize" />
          <cropper-handle action="se-resize" />
          <cropper-handle action="sw-resize" />
        </cropper-selection>
      </cropper-canvas>
    </div>

    <div class="crop-tool__actions">
      <span v-if="selectionError" class="crop-tool__error text-error text-body-2">
        {{ selectionError }}
      </span>
      <v-btn variant="text" prepend-icon="mdi-close" @click="cancel">Cancel</v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-check" @click="apply">
        Apply crop
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.crop-tool {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 24px;
  gap: 16px;
}

.crop-tool__stage {
  flex: 1 1 auto;
  min-height: 0;
}

.crop-tool__canvas {
  width: 100%;
  height: 100%;
}

.crop-tool__actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.crop-tool__error {
  margin-right: auto;
}
</style>
