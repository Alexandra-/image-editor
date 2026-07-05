<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { AdjustmentType } from '@/types/operations'

const store = useEditorStore()

/**
 * brightness/contrast/saturation are exposed to the user as a signed percentage
 * (-100..+100, neutral 0) mapped to a 0..2 filter multiplier (neutral 1).
 */
function signedAdjustment(type: AdjustmentType): WritableComputedRef<number> {
  return computed<number>({
    get: () => Math.round((store.getAdjustment(type) - 1) * 100),
    set: (percent) => store.setAdjustment(type, 1 + percent / 100),
  })
}

/** greyscale/sepia are a 0..100% intensity mapped to a 0..1 filter amount. */
function intensityAdjustment(type: AdjustmentType): WritableComputedRef<number> {
  return computed<number>({
    get: () => Math.round(store.getAdjustment(type) * 100),
    set: (percent) => store.setAdjustment(type, percent / 100),
  })
}

const brightness = signedAdjustment('brightness')
const contrast = signedAdjustment('contrast')
const saturation = signedAdjustment('saturation')
const greyscale = intensityAdjustment('greyscale')
const sepia = intensityAdjustment('sepia')

const cropLabel = computed(() => {
  const crop = store.cropOperation
  return crop ? `${crop.width} x ${crop.height} px` : 'Not cropped'
})
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__title text-subtitle-1 font-weight-medium px-4 pt-4 pb-2">Edit</div>

    <v-divider />

    <div class="sidebar__section">
      <div class="sidebar__section-header">
        <v-icon icon="mdi-crop" size="18" />
        <span>Crop</span>
        <span class="sidebar__hint">{{ cropLabel }}</span>
      </div>
      <div class="sidebar__crop-actions">
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-crop"
          @click="store.startCrop()"
        >
          {{ store.cropOperation ? 'Re-crop' : 'Crop image' }}
        </v-btn>
        <v-btn
          v-if="store.cropOperation"
          size="small"
          variant="text"
          prepend-icon="mdi-crop-free"
          @click="store.removeCrop()"
        >
          Remove
        </v-btn>
      </div>
    </div>

    <v-divider />

    <div class="sidebar__section">
      <div class="sidebar__section-header">
        <v-icon icon="mdi-tune-vertical" size="18" />
        <span>Adjustments</span>
      </div>

      <div class="sidebar__control">
        <div class="sidebar__control-label">
          <span>Brightness</span>
          <span class="sidebar__value">{{ brightness }}</span>
        </div>
        <v-slider v-model="brightness" :min="-100" :max="100" :step="1" />
      </div>

      <div class="sidebar__control">
        <div class="sidebar__control-label">
          <span>Contrast</span>
          <span class="sidebar__value">{{ contrast }}</span>
        </div>
        <v-slider v-model="contrast" :min="-100" :max="100" :step="1" />
      </div>

      <div class="sidebar__control">
        <div class="sidebar__control-label">
          <span>Saturation</span>
          <span class="sidebar__value">{{ saturation }}</span>
        </div>
        <v-slider v-model="saturation" :min="-100" :max="100" :step="1" />
      </div>
    </div>

    <v-divider />

    <div class="sidebar__section">
      <div class="sidebar__section-header">
        <v-icon icon="mdi-image-filter-black-white" size="18" />
        <span>Filters</span>
      </div>

      <div class="sidebar__control">
        <div class="sidebar__control-label">
          <span>Greyscale</span>
          <span class="sidebar__value">{{ greyscale }}%</span>
        </div>
        <v-slider v-model="greyscale" :min="0" :max="100" :step="1" />
      </div>

      <div class="sidebar__control">
        <div class="sidebar__control-label">
          <span>Sepia</span>
          <span class="sidebar__value">{{ sepia }}%</span>
        </div>
        <v-slider v-model="sepia" :min="0" :max="100" :step="1" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.sidebar__section {
  padding: 16px;
}

.sidebar__section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 12px;
}

.sidebar__hint {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.sidebar__crop-actions {
  display: flex;
  gap: 8px;
}

.sidebar__control {
  margin-bottom: 12px;
}

.sidebar__control-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 2px;
}

.sidebar__value {
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}
</style>
