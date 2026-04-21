import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session  = ref(null)
  const profile  = ref(null)
  const loading  = ref(true)

  const user      = computed(() => session.value?.user ?? null)
  const familiaId = computed(() => profile.value?.familia_id ?? null)
  const isReady   = computed(() => !loading.value)

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (data.session) await carregarProfile()
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, s) => {
      session.value = s
      if (s) await carregarProfile()
      else profile.value = null
    })
  }

  async function carregarProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*, familias(nome, codigo_convite)')
      .eq('id', session.value.user.id)
      .single()
    profile.value = data
  }

  async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    profile.value = null
    session.value = null
  }

  return { session, profile, loading, user, familiaId, isReady, init, loginGoogle, logout, carregarProfile }
})
