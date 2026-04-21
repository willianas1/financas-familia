<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <p class="text-white text-sm">{{ status }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const status = ref('Autenticando...')

let subscription = null
let timeout = null

onMounted(() => {
  // Timeout de segurança: se demorar mais de 15s, manda para login
  timeout = setTimeout(() => {
    status.value = 'Tempo esgotado. Redirecionando...'
    router.replace('/login')
  }, 15000)

  // Aguarda o Supabase processar o código OAuth (PKCE) e disparar SIGNED_IN
  // INITIAL_SESSION cobre o caso em que a sessão já estava disponível
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      clearTimeout(timeout)
      status.value = 'Verificando perfil...'

      const { data: profile } = await supabase
        .from('profiles')
        .select('familia_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.familia_id) {
        router.replace('/')
      } else {
        router.replace('/onboarding')
      }
    }
  })

  subscription = data.subscription
})

onUnmounted(() => {
  clearTimeout(timeout)
  subscription?.unsubscribe()
})
</script>
