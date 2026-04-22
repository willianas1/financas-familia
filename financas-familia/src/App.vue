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

      <!-- FAB speed-dial -->
      <div class="fixed bottom-20 right-4 md:bottom-6 z-30 flex flex-col items-end gap-3">

        <!-- Mini-ações (aparecem quando fabMenuAberto = true) -->
        <Transition
          enter-from-class="opacity-0 translate-y-2"
          enter-active-class="transition-all duration-150"
          leave-to-class="opacity-0 translate-y-2"
          leave-active-class="transition-all duration-100"
        >
          <div v-if="fabMenuAberto" class="flex flex-col items-end gap-2">

            <!-- Ler comprovante -->
            <label class="flex items-center gap-2 cursor-pointer">
              <span class="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                Ler comprovante
              </span>
              <span class="w-10 h-10 rounded-full bg-primary-600 text-white shadow flex items-center justify-center hover:bg-primary-700 transition-colors">
                <CameraIcon class="w-5 h-5" />
              </span>
              <input ref="inputFoto" type="file" accept="image/*" capture="environment" class="hidden" @change="processarFoto" />
            </label>

            <!-- Lançar manualmente -->
            <div class="flex items-center gap-2">
              <span class="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                Lançar manualmente
              </span>
              <button
                @click="abrirManual"
                class="w-10 h-10 rounded-full bg-danger text-white shadow flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <PenLineIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </Transition>

        <!-- Botão principal -->
        <button
          @click="fabMenuAberto = !fabMenuAberto"
          class="w-14 h-14 rounded-full bg-danger text-white shadow-lg flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all"
        >
          <XIcon v-if="fabMenuAberto" class="w-6 h-6" />
          <PlusIcon v-else class="w-6 h-6" />
        </button>
      </div>

      <!-- Loading: processando comprovante -->
      <div v-if="processandoFoto" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-2xl p-6 text-center shadow-xl">
          <div class="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm font-medium text-gray-700">Analisando comprovante...</p>
          <p class="text-xs text-gray-400 mt-1">Gemini está lendo a imagem</p>
        </div>
      </div>

      <!-- Toast de erro do scan -->
      <Transition
        enter-from-class="opacity-0 translate-y-2"
        enter-active-class="transition-all duration-200"
        leave-to-class="opacity-0"
        leave-active-class="transition-all duration-150"
      >
        <div
          v-if="erroScan"
          class="fixed bottom-36 right-4 left-4 sm:left-auto sm:max-w-xs z-40 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-md flex items-start gap-2"
        >
          <p class="text-sm text-danger flex-1">{{ erroScan }}</p>
          <button @click="erroScan = ''" class="text-red-300 hover:text-danger flex-shrink-0 mt-0.5">
            <XIcon class="w-4 h-4" />
          </button>
        </div>
      </Transition>

      <!-- Formulário de despesa (manual ou pré-preenchido pelo scan) -->
      <TransacaoForm
        v-if="fabAberto"
        :inicial="inicialFab"
        @fechar="fecharFab"
        @salvo="onFabSalvo"
      />
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { PlusIcon, XIcon, CameraIcon, PenLineIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/notificacoes'
import { useTransacoesStore } from '@/stores/transacoes'
import { extrairDespesaDeImagem, imagemParaBase64 } from '@/utils/gemini'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNav from '@/components/layout/AppNav.vue'
import TransacaoForm from '@/components/transacoes/TransacaoForm.vue'

const auth         = useAuthStore()
const notificacoes = useNotificacoesStore()
const transacoes   = useTransacoesStore()
const route        = useRoute()

const rotaPublica    = computed(() => route.meta.public)

const fabAberto      = ref(false)
const fabMenuAberto  = ref(false)
const processandoFoto = ref(false)
const erroScan       = ref('')
const inicialFab     = ref({ tipo: 'despesa' })
const inputFoto      = ref(null)

function abrirManual() {
  inicialFab.value    = { tipo: 'despesa' }
  fabMenuAberto.value = false
  fabAberto.value     = true
}

function fecharFab() {
  fabAberto.value  = false
  inicialFab.value = { tipo: 'despesa' }
}

async function onFabSalvo() {
  await transacoes.carregar()
}

async function processarFoto(event) {
  const file = event.target.files?.[0]
  if (!file) return

  fabMenuAberto.value  = false
  processandoFoto.value = true
  erroScan.value        = ''

  try {
    const base64 = await imagemParaBase64(file)
    const dados  = await extrairDespesaDeImagem(base64, file.type)

    inicialFab.value = {
      tipo:      'despesa',
      descricao: dados.descricao,
      valor:     dados.valor || '',
      data:      dados.data,
    }
    fabAberto.value = true
  } catch (e) {
    erroScan.value = `Não foi possível ler o comprovante: ${e.message}`
    setTimeout(() => { erroScan.value = '' }, 6000)
  } finally {
    processandoFoto.value = false
    if (inputFoto.value) inputFoto.value.value = ''
  }
}

onMounted(async () => {
  await auth.init()
  if (auth.familiaId) {
    notificacoes.carregar()
  }
})
</script>
