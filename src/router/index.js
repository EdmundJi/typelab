import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AdminReviewView from '@/views/AdminReviewView.vue'
import HomeView from '@/views/HomeView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import LoginView from '@/views/LoginView.vue'
import PathsView from '@/views/PathsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ResultView from '@/views/ResultView.vue'
import SubmitView from '@/views/SubmitView.vue'
import TypingView from '@/views/TypingView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/lesson/:id', name: 'lesson', component: TypingView },
  { path: '/result', name: 'result', component: ResultView },
  { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
  { path: '/paths', name: 'paths', component: PathsView },
  { path: '/paths/:id', name: 'path-detail', component: PathsView },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/submit', name: 'submit', component: SubmitView, meta: { requiresAuth: true } },
  {
    path: '/admin/review',
    name: 'admin-review',
    component: AdminReviewView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
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

  if (to.meta.requiresAdmin) {
    const role = userStore.user?.role ?? userStore.user?.user_metadata?.role ?? null
    if (role !== 'admin') {
      return { name: 'home' }
    }
  }
})

export default router
