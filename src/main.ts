import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { vuetify } from './plugins/vuetify'

// Registers all <cropper-*> custom elements (Cropper.js v2 defines them on import).
import 'cropperjs'

import '@mdi/font/css/materialdesignicons.css'
import './styles/global.css'

createApp(App).use(createPinia()).use(vuetify).mount('#app')
