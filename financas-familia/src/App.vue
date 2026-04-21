<template>
  <div v-if="auth.loading" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-500 text-sm">Carregando...</p>
    </div>
  </div>

  <template v-else>
    <!-- Páginas sem layout (login, onboarding) -->
    <RouterView v-if="rotaPublica" />

    <!-- Layout principal -->
    <div v-else class="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <div class="flex flex-1 max-w-4xl mx-auto w-full">
        <AppNav />
        <main class="flex-1 p-4 pb-24 md:pb-6 min-w-0">
          <RouterView />
        </main>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/notificacoes'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNav from '@/components/layout/AppNav.vue'

const auth         = useAuthStore()
const notificacoes = useNotificacoesStore()
const route        = useRoute()

const rotaPublica = computed(() => route.meta.public)

onMounted(async () => {
  await auth.init()
  if (auth.familiaId) {
    notificacoes.carregar()
  }
})
</script>
