import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { getCurrentSession } from './lib/db'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

async function bootstrap() {
  const userStore = useUserStore()
  const { data, error } = await getCurrentSession()

  if (!error) {
    userStore.setSession(data.session)
  }

  app.use(router)
  app.mount('#app')
}

bootstrap()
