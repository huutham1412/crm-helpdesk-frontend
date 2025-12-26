import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

const toastOptions = {
  timeout: 5000,
  position: 'top-right',
  closeOnClick: true,
  pauseOnHover: true,
}

app.use(pinia)
app.use(router)
app.use(Toast, toastOptions)

app.mount('#app')
