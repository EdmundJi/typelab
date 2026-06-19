import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({ session: null as any, user: null as any }),
  getters: {
    isLoggedIn: (state) => Boolean(state.session),
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.user_metadata?.role === 'admin',
  },
  actions: {
    setSession(session: any) {
      this.session = session
      this.user = session?.user
        ? { ...session.user, id: session.user.id, email: session.user.email }
        : null
    },
    clearSession() {
      this.session = null
      this.user = null
    },
  },
})
