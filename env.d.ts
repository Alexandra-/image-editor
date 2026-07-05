/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// Cropper.js v2 registers native custom elements. Declare them so vue-tsc does not
// treat them as unknown Vue components during type checking.
declare module 'vue' {
  interface GlobalComponents {
    'cropper-canvas': DefineComponent<Record<string, unknown>>
    'cropper-image': DefineComponent<Record<string, unknown>>
    'cropper-shade': DefineComponent<Record<string, unknown>>
    'cropper-handle': DefineComponent<Record<string, unknown>>
    'cropper-selection': DefineComponent<Record<string, unknown>>
    'cropper-grid': DefineComponent<Record<string, unknown>>
    'cropper-crosshair': DefineComponent<Record<string, unknown>>
  }
}

export {}
