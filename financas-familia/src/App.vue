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

      <!-- FAB global -->
      <button
        @click="fabAberto = true"
        class="fixed bottom-20 right-4 md:bottom-6 w-14 h-14 rounded-full bg-danger text-white shadow-lg flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all z-30"
      >
        <PlusIcon class="w-6 h-6" />
      </button>

      <TransacaoForm
        v-if="fabAberto"
        :inicial="{ tipo: 'despesa' }"
        @fechar="fabAberto = false"
        @salvo="onFabSalvo"
      />
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { PlusIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/notificacoes'
import { useTransacoesStore } from '@/stores/transacoes'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNav from '@/components/layout/AppNav.vue'
import TransacaoForm from '@/components/transacoes/TransacaoForm.vue'

const auth         = useAuthStore()
const notificacoes = useNotificacoesStore()
const transacoes   = useTransacoesStore()
const route        = useRoute()
const fabAberto    = ref(false)

const rotaPublica = computed(() => route.meta.public)

async function onFabSalvo() {
  await transacoes.carregar()
}

onMounted(async () => {
  await auth.init()
  if (auth.familiaId) {
    notificacoes.carregar()
  }
})
</script>
