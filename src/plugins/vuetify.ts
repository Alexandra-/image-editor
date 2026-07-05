import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const editorDark = {
  dark: true,
  colors: {
    background: '#0f1115',
    surface: '#171a21',
    'surface-bright': '#1f2430',
    primary: '#4f8cff',
    secondary: '#8b93a7',
    accent: '#22d3ee',
    error: '#ef4444',
    info: '#38bdf8',
    success: '#22c55e',
    warning: '#f59e0b',
  },
}

const editorLight = {
  dark: false,
  colors: {
    background: '#f4f5f7',
    surface: '#ffffff',
    'surface-bright': '#ffffff',
    primary: '#3b6ff0',
    secondary: '#64748b',
    accent: '#06b6d4',
    error: '#ef4444',
    info: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
  },
}

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'editorLight',
    themes: {
      editorLight,
      editorDark,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VBtn: {
      variant: 'text',
    },
    VSlider: {
      hideDetails: true,
      color: 'primary',
    },
  },
})
