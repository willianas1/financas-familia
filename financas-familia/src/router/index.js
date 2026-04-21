import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const routes = [
  { path: '/login',         name: 'login',         component: () => import('@/pages/LoginPage.vue'),         meta: { public: true } },
  { path: '/auth/callback', name: 'auth-callback', component: () => import('@/pages/AuthCallbackPage.vue'),  meta: { public: true } },
  { path: '/onboarding',    name: 'onboarding',    component: () => import('@/pages/OnboardingPage.vue') },
  { path: '/',              name: 'dashboard',     component: () => import('@/pages/DashboardPage.vue') },
  { path: '/lancamentos',   name: 'lancamentos',   component: () => import('@/pages/LancamentosPage.vue') },
  { path: '/orcamentos',    name: 'orcamentos',    component: () => import('@/pages/OrcamentosPage.vue') },
  { path: '/cartoes',       name: 'cartoes',       component: () => import('@/pages/CartoesPage.vue') },
  { path: '/configuracoes', name: 'configuracoes', component: () => import('@/pages/ConfiguracoesPage.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) return

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { name: 'login' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('familia_id')
    .eq('id', session.user.id)
    .single()

  // Sem família: só pode acessar o onboarding
  if (!profile?.familia_id && to.name !== 'onboarding') return { name: 'onboarding' }

  // Com família: não precisa mais do onboarding
  if (profile?.familia_id && to.name === 'onboarding') return { name: 'dashboard' }
})

export default router
