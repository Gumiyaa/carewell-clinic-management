import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuth } from './lib/auth.js'

const app = createApp(App)
app.use(router)

// Tunggu router resolve dulu (agar meta.public benar saat render pertama),
// lalu pulihkan sesi, baru mount.
router
  .isReady()
  .then(() => useAuth().bootstrap())
  .finally(() => app.mount('#app'))
