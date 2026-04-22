<template>
  <div>
    <!-- Cabeçalho -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-900">Lançamentos</h1>
      <button @click="formAberto = true" class="btn-primary gap-2">
        <PlusIcon class="w-4 h-4" />
        <span class="hidden sm:inline">Novo</span>
      </button>
    </div>

    <!-- Filtro de campo de data -->
    <div class="flex bg-gray-100 rounded-xl p-1 mb-3">
      <button
        v-for="fd in filtrosDatas"
        :key="fd.value"
        @click="trocarFiltroDe(fd.value)"
        :class="['flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                 filtroDe === fd.value ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500']"
      >
        {{ fd.label }}
      </button>
    </div>

    <!-- Seletor de mês -->
    <div class="card mb-4 flex items-center justify-between p-3">
      <button @click="mudarMes(-1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <span class="font-semibold text-gray-900 capitalize">{{ mesLabel }}</span>
      <button @click="mudarMes(1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronRightIcon class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <!-- Resumo (só no modo lançamento) -->
    <div v-if="filtroDe === 'data'" class="grid grid-cols-3 gap-3 mb-4">
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

    <!-- Filtros de tipo + status -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
      <button
        v-for="f in filtrosTipo"
        :key="f.value"
        @click="filtroTipo = f.value"
        :class="['px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                 filtroTipo === f.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200']"
      >
        {{ f.label }}
      </button>

      <template v-if="filtroDe !== 'data'">
        <div class="w-px bg-gray-200 flex-shrink-0"></div>
        <button
          v-for="s in filtrosStatus"
          :key="s.value"
          @click="filtroStatus = s.value"
          :class="['px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                   filtroStatus === s.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200']"
        >
          {{ s.label }}
        </button>
      </template>
    </div>

    <!-- Filtro por centro de custo -->
    <div v-if="ccStore.centros.length" class="flex gap-2 mb-4 overflow-x-auto pb-1">
      <button
        @click="filtroCC = ''"
        :class="['px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                 !filtroCC ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200']"
      >
        Todos centros
      </button>
      <button
        v-for="c in ccStore.ativos"
        :key="c.id"
        @click="filtroCC = filtroCC === c.id ? '' : c.id"
        :class="['px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                 filtroCC === c.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200']"
        :style="filtroCC === c.id ? { backgroundColor: c.cor } : {}"
      >
        {{ c.nome }}
      </button>
    </div>

    <!-- Lista -->
    <div v-if="carregando" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card animate-pulse h-16"></div>
    </div>

    <div v-else-if="!listaFiltrada.length" class="card text-center py-12 text-gray-400">
      <ReceiptIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">Nenhum lançamento encontrado</p>
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
          <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span class="text-xs text-gray-400">{{ formatarDataCurta(t.data) }}</span>
            <span v-if="t.num_parcela" class="text-xs text-primary-500">· parcela {{ t.num_parcela }}</span>
            <span
              v-if="t.cartoes_credito"
              class="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
              :style="{ backgroundColor: t.cartoes_credito.cor }"
            >
              {{ t.cartoes_credito.nome }}
            </span>
            <span
              v-if="t.centros_custo"
              class="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
              :style="{ backgroundColor: t.centros_custo.cor }"
            >
              {{ t.centros_custo.nome }}
            </span>
            <span
              v-if="t.data_vencimento && t.tipo === 'despesa'"
              class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              :class="badgeVencimentoClass(t)"
            >
              vence {{ formatarDataCurta(t.data_vencimento) }}
            </span>
            <span
              v-if="t.tipo === 'despesa' && t.status_pagamento"
              class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              :class="t.status_pagamento === 'pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
            >
              {{ t.status_pagamento === 'pago' ? `pago ${t.data_pagamento ? formatarDataCurta(t.data_pagamento) : ''}` : 'pendente' }}
            </span>
          </div>
        </div>

        <div class="text-right flex-shrink-0">
          <p :class="['font-bold text-sm', t.tipo === 'receita' ? 'text-success' : 'text-danger']">
            {{ t.tipo === 'receita' ? '+' : '-' }}{{ formatarMoeda(t.valor) }}
          </p>
        </div>

        <!-- Botão pagar (só para despesas pendentes) -->
        <button
          v-if="t.tipo === 'despesa' && t.status_pagamento === 'pendente'"
          @click="abrirPagamento(t)"
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-200 text-success text-xs font-semibold hover:bg-green-100 transition-colors flex-shrink-0"
        >
          <CheckCircleIcon class="w-3.5 h-3.5" />
          Pagar
        </button>

        <!-- Botão editar centro de custo (despesas em aberto com centros cadastrados) -->
        <button
          v-if="t.tipo === 'despesa' && t.status_pagamento === 'pendente' && ccStore.centros.length"
          @click="abrirEditarCC(t)"
          class="p-1 rounded-lg hover:bg-primary-50 text-gray-300 hover:text-primary-500 transition-colors flex-shrink-0"
          title="Alterar centro de custo"
        >
          <FolderIcon class="w-4 h-4" />
        </button>

        <button
          @click="confirmarRemover(t)"
          class="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-danger transition-colors flex-shrink-0"
        >
          <Trash2Icon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Modal: novo lançamento -->
    <TransacaoForm v-if="formAberto" @fechar="formAberto = false" @salvo="onSalvo" />

    <!-- Modal: confirmar pagamento -->
    <div
      v-if="pagando"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="pagando = null"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            :style="{ backgroundColor: pagando.categorias?.cor ?? '#9ca3af' }"
          >
            {{ (pagando.categorias?.nome ?? 'O')[0] }}
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ pagando.descricao || pagando.categorias?.nome || 'Despesa' }}</p>
            <p class="text-danger font-bold">{{ formatarMoeda(pagando.valor) }}</p>
          </div>
        </div>

        <div class="mb-5">
          <label class="label text-sm">Data de pagamento</label>
          <input v-model="dataPagamento" type="date" class="input" />
        </div>

        <div class="flex gap-3">
          <button @click="pagando = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarPagamento" :disabled="salvandoPagamento" class="btn-primary flex-1">
            {{ salvandoPagamento ? 'Salvando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: editar centro de custo -->
    <div
      v-if="editandoCC"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="editandoCC = null"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Centro de custo</h3>
        <p class="text-sm text-gray-500 mb-4 truncate">{{ editandoCC.descricao || editandoCC.categorias?.nome }}</p>

        <div class="mb-5">
          <select v-model="novoCCId" class="input">
            <option value="">Nenhum</option>
            <option v-for="c in ccStore.ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>

        <div class="flex gap-3">
          <button @click="editandoCC = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarEditarCC" :disabled="salvandoCC" class="btn-primary flex-1">
            {{ salvandoCC ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: confirmar remoção -->
    <div
      v-if="removendo"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="removendo = null"
    >
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
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, ReceiptIcon, Trash2Icon, CheckCircleIcon, FolderIcon } from 'lucide-vue-next'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'
import { useCentrosCustoStore } from '@/stores/centrosCusto'
import TransacaoForm from '@/components/transacoes/TransacaoForm.vue'

const transacoes  = useTransacoesStore()
const categorias  = useCategoriasStore()
const ccStore     = useCentrosCustoStore()
const formAberto  = ref(false)
const removendo   = ref(null)
const filtroTipo   = ref('todos')
const filtroStatus = ref('todos')
const filtroDe     = ref('data')
const filtroCC     = ref('')
const carregando  = ref(false)
const listaExtra  = ref([])

// Pagamento
const pagando          = ref(null)
const dataPagamento    = ref('')
const salvandoPagamento = ref(false)

const hoje     = new Date()
const mesAtual = ref(hoje.getMonth() + 1)
const anoAtual = ref(hoje.getFullYear())
const hojeStr  = hoje.toISOString().split('T')[0]

const filtrosDatas = [
  { value: 'data',            label: 'Lançamento' },
  { value: 'data_vencimento', label: 'Vencimento' },
  { value: 'data_pagamento',  label: 'Pagamento' },
]
const filtrosTipo = [
  { value: 'todos',   label: 'Todos' },
  { value: 'despesa', label: 'Despesas' },
  { value: 'receita', label: 'Receitas' },
]
const filtrosStatus = [
  { value: 'todos',    label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'pago',     label: 'Pagas' },
]

const mesLabel = computed(() =>
  new Date(anoAtual.value, mesAtual.value - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

const listaBase = computed(() =>
  filtroDe.value === 'data' ? transacoes.transacoes : listaExtra.value
)

const listaFiltrada = computed(() => {
  let lista = listaBase.value
  if (filtroTipo.value !== 'todos')
    lista = lista.filter(t => t.tipo === filtroTipo.value)
  if (filtroDe.value !== 'data' && filtroStatus.value !== 'todos')
    lista = lista.filter(t => t.status_pagamento === filtroStatus.value)
  if (filtroCC.value)
    lista = lista.filter(t => t.centro_custo_id === filtroCC.value)
  return lista
})

function badgeVencimentoClass(t) {
  if (!t.data_vencimento || t.status_pagamento === 'pago') return 'bg-gray-100 text-gray-500'
  const hojeStr = new Date().toISOString().split('T')[0]
  const venc    = t.data_vencimento
  if (venc < hojeStr)   return 'bg-red-100 text-red-600'
  if (venc === hojeStr) return 'bg-orange-100 text-orange-600'
  return 'bg-gray-100 text-gray-500'
}

function abrirPagamento(t) {
  pagando.value = t
  dataPagamento.value = hojeStr
}

async function confirmarPagamento() {
  salvandoPagamento.value = true
  try {
    await transacoes.marcarPago(pagando.value.id, dataPagamento.value)
    // Atualiza o item na lista extra também (modos vencimento/pagamento)
    const item = listaExtra.value.find(t => t.id === pagando.value.id)
    if (item) {
      item.status_pagamento = 'pago'
      item.data_pagamento   = dataPagamento.value
    }
    pagando.value = null
  } finally {
    salvandoPagamento.value = false
  }
}

async function carregar() {
  carregando.value = true
  if (filtroDe.value === 'data') {
    await transacoes.carregar(mesAtual.value, anoAtual.value)
  } else {
    listaExtra.value = await transacoes.carregarPorCampoData(filtroDe.value, mesAtual.value, anoAtual.value)
  }
  carregando.value = false
}

async function trocarFiltroDe(valor) {
  filtroDe.value    = valor
  filtroStatus.value = 'todos'
  await carregar()
}

async function mudarMes(delta) {
  let m = mesAtual.value + delta
  let a = anoAtual.value
  if (m > 12) { m = 1; a++ }
  if (m < 1)  { m = 12; a-- }
  mesAtual.value = m
  anoAtual.value = a
  await carregar()
}

// --- Editar centro de custo ---
const editandoCC      = ref(null)   // transação sendo editada
const novoCCId        = ref('')
const salvandoCC      = ref(false)

function abrirEditarCC(t) {
  editandoCC.value = t
  novoCCId.value   = t.centro_custo_id ?? ''
}

async function confirmarEditarCC() {
  salvandoCC.value = true
  try {
    const centroId = novoCCId.value || null
    const atualizado = await transacoes.atualizarCampo(editandoCC.value.id, { centro_custo_id: centroId })
    // Atualiza também na listaExtra (modos vencimento/pagamento)
    const item = listaExtra.value.find(t => t.id === editandoCC.value.id)
    if (item) {
      item.centro_custo_id = atualizado.centro_custo_id
      item.centros_custo   = atualizado.centros_custo
    }
    editandoCC.value = null
  } finally {
    salvandoCC.value = false
  }
}

function confirmarRemover(t) { removendo.value = t }

async function executarRemover() {
  await transacoes.remover(removendo.value.id)
  listaExtra.value = listaExtra.value.filter(t => t.id !== removendo.value.id)
  removendo.value = null
}

function onSalvo() { carregar() }

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataCurta(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

onMounted(async () => {
  await Promise.all([categorias.carregar(), ccStore.carregar()])
  await carregar()
})
</script>
