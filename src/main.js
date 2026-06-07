import './assets/main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { getCurrentSession, onAuthStateChange } from './lib/db'
import router from './router'
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

  const { data: { subscription } } = onAuthStateChange((session) => {
    userStore.setSession(session)
  })

  // subscription 保留引用，防止 GC 提前回收（App 级别无需 unsubscribe）
  void subscription

  app.use(router)
  app.mount('#app')
}

bootstrap()
