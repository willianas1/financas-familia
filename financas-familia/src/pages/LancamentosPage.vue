<template>
  <div>
    <!-- Cabeçalho da página -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-900">Lançamentos</h1>
      <button @click="formAberto = true" class="btn-primary gap-2">
        <PlusIcon class="w-4 h-4" />
        <span class="hidden sm:inline">Novo</span>
      </button>
    </div>

    <!-- Seletor de mês -->
    <div class="card mb-4 flex items-center justify-between p-3">
      <button @click="mudarMes(-1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <span class="font-semibold text-gray-900 capitalize">
        {{ mesLabel }}
      </span>
      <button @click="mudarMes(1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronRightIcon class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <!-- Resumo do mês -->
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="card text-center p-3">
        <p class="text-xs text-gray-500 mb-1">Receitas</p>
        <p class="font-bold text-success text-sm">{{ formatarMoeda(transacoes.totalReceitas) }}</p>
      </div>
      <div class="card text-center p-3">
        <p class="text-xs text-gray-500 mb-1">Despesas</p>
        <p class="font-bold text-danger text-sm">{{ formatarMoeda(transacoes.totalDespesas) }}</p>
      </div>
      <div class="card text-center p-3">
        <p class="text-xs text-gray-500 mb-1">Saldo</p>
        <p :class="['font-bold text-sm', transacoes.saldo >= 0 ? 'text-success' : 'text-danger']">
          {{ formatarMoeda(transacoes.saldo) }}
        </p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
      <button
        v-for="f in filtros"
        :key="f.value"
        @click="filtroAtivo = f.value"
        :class="['px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                 filtroAtivo === f.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200']"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Lista de transações -->
    <div v-if="transacoes.loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card animate-pulse h-16"></div>
    </div>

    <div v-else-if="!listaFiltrada.length" class="card text-center py-12 text-gray-400">
      <ReceiptIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">Nenhum lançamento neste mês</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="t in listaFiltrada"
        :key="t.id"
        class="card flex items-center gap-3 p-3"
      >
        <!-- Ícone da categoria -->
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
          :style="{ backgroundColor: t.categorias?.cor ?? '#9ca3af' }"
        >
          {{ (t.categorias?.nome ?? 'O')[0] }}
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ t.descricao || t.categorias?.nome || '—' }}
          </p>
          <p class="text-xs text-gray-400">
            {{ formatarDataCurta(t.data) }}
            <span v-if="t.num_parcela" class="ml-1 text-primary-500">· parcela {{ t.num_parcela }}</span>
          </p>
        </div>

        <div class="text-right flex-shrink-0">
          <p :class="['font-bold text-sm', t.tipo === 'receita' ? 'text-success' : 'text-danger']">
            {{ t.tipo === 'receita' ? '+' : '-' }}{{ formatarMoeda(t.valor) }}
          </p>
        </div>

        <button @click="confirmarRemover(t)" class="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-danger transition-colors flex-shrink-0">
          <Trash2Icon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- FAB Mobile -->
    <button
      @click="formAberto = true"
      class="fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-30"
    >
      <PlusIcon class="w-6 h-6" />
    </button>

    <!-- Modal formulário -->
    <TransacaoForm v-if="formAberto" @fechar="formAberto = false" @salvo="onSalvo" />

    <!-- Confirmação remover -->
    <div v-if="removendo" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="removendo = null">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <Trash2Icon class="w-10 h-10 text-danger mx-auto mb-3" />
        <p class="font-semibold text-gray-900 mb-1">Remover lançamento?</p>
        <p class="text-sm text-gray-500 mb-5">{{ removendo.descricao || removendo.categorias?.nome }}</p>
        <div class="flex gap-3">
          <button @click="removendo = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="executarRemover" class="btn-danger flex-1">Remover</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, ReceiptIcon, Trash2Icon } from 'lucide-vue-next'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'
import TransacaoForm from '@/components/transacoes/TransacaoForm.vue'

const transacoes  = useTransacoesStore()
const categorias  = useCategoriasStore()
const formAberto  = ref(false)
const removendo   = ref(null)
const filtroAtivo = ref('todos')

const hoje     = new Date()
const mesAtual = ref(hoje.getMonth() + 1)
const anoAtual = ref(hoje.getFullYear())

const filtros = [
  { value: 'todos',   label: 'Todos' },
  { value: 'despesa', label: 'Despesas' },
  { value: 'receita', label: 'Receitas' },
]

const mesLabel = computed(() =>
  new Date(anoAtual.value, mesAtual.value - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

const listaFiltrada = computed(() =>
  filtroAtivo.value === 'todos'
    ? transacoes.transacoes
    : transacoes.transacoes.filter(t => t.tipo === filtroAtivo.value)
)

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataCurta(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

async function mudarMes(delta) {
  let m = mesAtual.value + delta
  let a = anoAtual.value
  if (m > 12) { m = 1; a++ }
  if (m < 1)  { m = 12; a-- }
  mesAtual.value = m
  anoAtual.value = a
  await transacoes.carregar(m, a)
}

function confirmarRemover(t) { removendo.value = t }

async function executarRemover() {
  await transacoes.remover(removendo.value.id)
  removendo.value = null
}

function onSalvo() {
  transacoes.carregar(mesAtual.value, anoAtual.value)
}

onMounted(async () => {
  await categorias.carregar()
  await transacoes.carregar(mesAtual.value, anoAtual.value)
})
</script>
