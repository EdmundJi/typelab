import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HomeView from '@/views/HomeView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import LoginView from '@/views/LoginView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ResultView from '@/views/ResultView.vue'
import TypingView from '@/views/TypingView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/lesson/:id', name: 'lesson', component: TypingView },
  { path: '/result', name: 'result', component: ResultView },
  { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.session) {
    return { name: 'login' }
  }
})

export default router
