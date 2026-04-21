<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">Configurações</h1>

    <!-- Código de convite -->
    <div class="card">
      <h2 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <UsersIcon class="w-4 h-4 text-primary-600" />
        Código da família
      </h2>
      <p class="text-sm text-gray-500 mb-3">Compartilhe este código para que outros membros entrem na sua família.</p>
      <div class="flex items-center gap-2">
        <div class="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono text-xl font-bold text-gray-900 tracking-widest text-center">
          {{ auth.profile?.familias?.codigo_convite ?? '—' }}
        </div>
        <button @click="copiarCodigo" class="btn-secondary gap-2">
          <CopyIcon class="w-4 h-4" />
          {{ copiado ? 'Copiado!' : 'Copiar' }}
        </button>
      </div>
    </div>

    <!-- Categorias -->
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900 flex items-center gap-2">
          <TagIcon class="w-4 h-4 text-primary-600" />
          Categorias
        </h2>
        <button @click="formCatAberto = true" class="btn-primary py-1.5 px-3 text-xs">
          + Nova
        </button>
      </div>

      <div class="space-y-1">
        <div
          v-for="cat in cats.categorias"
          :key="cat.id"
          class="flex items-center gap-3 py-2"
        >
          <div class="w-7 h-7 rounded-lg flex-shrink-0" :style="{ backgroundColor: cat.cor }"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ cat.nome }}</p>
            <p class="text-xs text-gray-400">{{ cat.tipo === 'receita' ? 'Receita' : 'Despesa' }}</p>
          </div>
          <span :class="['text-xs px-2 py-0.5 rounded-full', cat.ativa ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-400']">
            {{ cat.ativa ? 'Ativa' : 'Inativa' }}
          </span>
          <button @click="cats.toggleAtiva(cat.id)" class="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <component :is="cat.ativa ? EyeOffIcon : EyeIcon" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Instalar app -->
    <div class="card">
      <h2 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <SmartphoneIcon class="w-4 h-4 text-primary-600" />
        Instalar app
      </h2>

      <div v-if="podeInstalar">
        <p class="text-sm text-gray-500 mb-3">Adicione na tela inicial do seu celular para acesso rápido, sem precisar abrir o navegador.</p>
        <button @click="instalar" class="btn-primary w-full flex items-center justify-center gap-2">
          <DownloadIcon class="w-4 h-4" />
          Instalar no celular
        </button>
      </div>

      <div v-else-if="instalado" class="flex items-center gap-2 text-success text-sm">
        <CheckCircleIcon class="w-4 h-4" />
        App já instalado na tela inicial.
      </div>

      <div v-else-if="isIOS">
        <p class="text-sm text-gray-500 mb-2">No iPhone ou iPad, use o Safari:</p>
        <ol class="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta)</li>
          <li>Selecione <strong>"Adicionar à Tela de Início"</strong></li>
        </ol>
      </div>

      <div v-else>
        <p class="text-sm text-gray-400">Abra o app no Chrome ou Edge para instalar.</p>
      </div>
    </div>

    <!-- Modal nova categoria -->
    <div v-if="formCatAberto" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="formCatAberto = false">
      <div class="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5">
        <h3 class="font-bold text-gray-900 mb-4">Nova categoria</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Nome</label>
            <input v-model="novaCat.nome" class="input" placeholder="Ex: Academia" maxlength="40" />
          </div>
          <div>
            <label class="label">Tipo</label>
            <select v-model="novaCat.tipo" class="input">
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <div>
            <label class="label">Cor</label>
            <input v-model="novaCat.cor" type="color" class="h-10 w-full rounded-lg border border-gray-300 cursor-pointer" />
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="formCatAberto = false" class="btn-secondary flex-1">Cancelar</button>
            <button @click="criarCategoria" :disabled="!novaCat.nome.trim() || salvandoCat" class="btn-primary flex-1">
              {{ salvandoCat ? 'Salvando...' : 'Criar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { UsersIcon, CopyIcon, TagIcon, EyeIcon, EyeOffIcon, SmartphoneIcon, DownloadIcon, CheckCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCategoriasStore } from '@/stores/categorias'

const auth       = useAuthStore()
const cats       = useCategoriasStore()
const copiado    = ref(false)
const formCatAberto = ref(false)
const salvandoCat   = ref(false)

const promptEvento = ref(null)
const podeInstalar = ref(false)
const instalado    = ref(false)
const isIOS        = computed(() => /iphone|ipad|ipod/i.test(navigator.userAgent))

function onBeforeInstallPrompt(e) {
  e.preventDefault()
  promptEvento.value = e
  podeInstalar.value = true
}

function onAppInstalled() {
  podeInstalar.value = false
  instalado.value    = true
}

async function instalar() {
  if (!promptEvento.value) return
  promptEvento.value.prompt()
  const { outcome } = await promptEvento.value.userChoice
  if (outcome === 'accepted') instalado.value = true
  podeInstalar.value = false
  promptEvento.value = null
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})

const novaCat = ref({ nome: '', tipo: 'despesa', cor: '#6366f1' })

function copiarCodigo() {
  const codigo = auth.profile?.familias?.codigo_convite
  if (!codigo) return
  navigator.clipboard.writeText(codigo)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 2000)
}

async function criarCategoria() {
  salvandoCat.value = true
  try {
    await cats.criar({ nome: novaCat.value.nome.trim(), tipo: novaCat.value.tipo, cor: novaCat.value.cor })
    formCatAberto.value = false
    novaCat.value = { nome: '', tipo: 'despesa', cor: '#6366f1' }
  } finally {
    salvandoCat.value = false
  }
}

onMounted(() => cats.carregar())
</script>
