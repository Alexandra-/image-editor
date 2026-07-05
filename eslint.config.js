import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// Globals produced by unplugin-auto-import (ref, computed, defineStore, ...).
// The file is generated on first build; fall back to an empty set so `npm run lint`
// does not crash on a fresh clone before the project has been built.
let autoImportGlobals = { globals: {} }
try {
  autoImportGlobals = JSON.parse(
    readFileSync(fileURLToPath(new URL('./.eslintrc-auto-import.json', import.meta.url)), 'utf-8'),
  )
} catch {
  // file not yet generated — auto-import globals will be flagged as undefined until first build
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/node_modules/**', 'auto-imports.d.ts']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'app/auto-import-globals',
    languageOptions: {
      globals: {
        ...autoImportGlobals.globals,
      },
    },
  },

  // Must be last: disables ESLint rules that would conflict with Prettier.
  skipFormatting,
)
