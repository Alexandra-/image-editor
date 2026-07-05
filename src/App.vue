<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import EditorToolbar from '@/components/EditorToolbar.vue'
import EditSidebar from '@/components/EditSidebar.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import EditorCanvas from '@/components/EditorCanvas.vue'
import CropTool from '@/components/CropTool.vue'

const store = useEditorStore()

const editPanelOpen = computed({
  get: () => store.isEditPanelOpen && store.hasImage,
  // Route through the store action so isCropping is always reset on close,
  // even when the drawer is dismissed via Escape / overlay click.
  set: (value: boolean) => store.setEditPanelOpen(value),
})
</script>

<template>
  <v-app>
    <v-app-bar flat color="surface">
      <v-app-bar-title>
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-image-edit-outline" color="primary" />
          <span class="text-body-1 font-weight-medium">Image Editor</span>
        </div>
      </v-app-bar-title>

      <template #append>
        <EditorToolbar />
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-model="editPanelOpen"
      location="right"
      width="320"
      color="surface"
      floating
    >
      <EditSidebar />
    </v-navigation-drawer>

    <v-main class="app-main">
      <div class="stage">
        <ImageUploader v-if="!store.hasImage" />
        <CropTool v-else-if="store.isCropping" />
        <EditorCanvas v-else />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-main {
  background: rgb(var(--v-theme-background));
}

.stage {
  /* var(--v-layout-top) is set by Vuetify to the app-bar height, so this
     stays correct if the bar's density or size ever changes. */
  height: calc(100vh - var(--v-layout-top));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
