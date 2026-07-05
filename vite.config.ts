import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  // GitHub Pages serves from /image-editor/; locally BASE_URL is unset so base stays '/'.
  base: process.env.BASE_URL ?? '/',
  plugins: [
    // Auto-import the Vue and Pinia composition APIs (ref, computed, watch,
    // defineStore, ...). Scoped to these libraries only; components are still
    // imported explicitly to keep dependencies visible. Types are emitted to
    // ./auto-imports.d.ts (committed to git).
    AutoImport({
      imports: ['vue', 'pinia'],
      dts: './auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: 'readonly',
      },
    }),
    vue({
      template: {
        compilerOptions: {
          // Treat all <cropper-*> tags as Cropper.js v2 web components, not Vue components.
          isCustomElement: (tag) => tag.startsWith('cropper-'),
        },
      },
    }),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
