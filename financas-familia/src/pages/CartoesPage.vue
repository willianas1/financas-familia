<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">Cartões de crédito</h1>

    <!-- Seletor de fatura -->
    <div class="card flex items-center justify-between p-3">
      <button @click="mudarFatura(-1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <span class="font-semibold text-gray-900 capitalize">Fatura {{ faturaLabel }}</span>
      <button @click="mudarFatura(1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronRightIcon class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <!-- Totalizador -->
    <div v-if="cartoes.ativos.length && !carregando" class="card p-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="text-center">
          <p class="text-xs text-gray-500 mb-1">Total da fatura</p>
          <p class="font-bold text-danger text-lg">{{ formatarMoeda(totalGeral) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500 mb-1">Pendente</p>
          <p class="font-bold text-orange-500 text-lg">{{ formatarMoeda(totalPendenteFatura) }}</p>
        </div>
      </div>
    </div>

    <!-- Filtro por centro de custo -->
    <div v-if="ccStore.ativos.length && !carregando" class="flex gap-2 overflow-x-auto pb-1">
      <button
        @click="filtroCC = ''"
        :class="['px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                 !filtroCC ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200']"
      >
        Todos
      </button>
      <button
        v-for="c in ccStore.ativos"
        :key="c.id"
        @click="filtroCC = filtroCC === c.id ? '' : c.id"
        :class="['px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex-shrink-0',
                 filtroCC === c.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200']"
        :style="filtroCC === c.id ? { backgroundColor: c.cor } : {}"
      >
        {{ c.nome }}
      </button>
    </div>

    <!-- Sem cartões -->
    <div v-if="!cartoes.cartoes.length" class="card text-center py-12 text-gray-400">
      <CreditCardIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">Nenhum cartão cadastrado</p>
      <RouterLink to="/configuracoes" class="text-primary-600 text-sm mt-2 inline-block hover:underline">
        Adicionar em Configurações
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-else-if="carregando" class="space-y-3">
      <div v-for="i in cartoes.ativos.length || 2" :key="i" class="card animate-pulse h-32"></div>
    </div>

    <!-- Cards por cartão -->
    <div v-else v-for="cartao in cartoes.ativos" :key="cartao.id" class="card overflow-hidden">
      <!-- Header colorido -->
      <div
        class="flex items-center justify-between p-4 -mx-5 -mt-5 mb-4"
        :style="{ backgroundColor: cartao.cor }"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <CreditCardIcon class="w-5 h-5 text-white/80 flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-bold text-white">{{ cartao.nome }}</p>
            <p class="text-white/70 text-xs capitalize">
              {{ cartao.bandeira || 'cartão' }}
              <span v-if="cartao.ultimos_digitos">·· {{ cartao.ultimos_digitos }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-right">
            <p class="text-white/70 text-xs">Total da fatura</p>
            <p class="text-white font-bold text-lg">{{ formatarMoeda(totalFatura(cartao.id)) }}</p>
            <p v-if="(totalPendenteGeral[cartao.id] ?? 0) > 0" class="text-white/60 text-[10px] mt-0.5">
              Dívida total: {{ formatarMoeda(totalPendenteGeral[cartao.id]) }}
            </p>
          </div>
          <button
            @click.stop="abrirImportacao(cartao)"
            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            title="Importar fatura CSV"
          >
            <UploadIcon class="w-4 h-4 text-white" />
          </button>
          <button
            @click.stop="abrirFormDespesa(cartao)"
            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            title="Nova despesa neste cartão"
          >
            <PlusIcon class="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <!-- Info da fatura: vencimento + status -->
      <div class="flex items-center justify-between mb-3 -mt-1">
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span v-if="vencimentoFatura(cartao)" class="flex items-center gap-1">
            <CalendarIcon class="w-3.5 h-3.5" />
            Vence {{ vencimentoFatura(cartao) }}
          </span>
          <span v-else class="text-gray-400 italic">Sem dia de vencimento</span>
        </div>
        <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', badgeStatusFatura(cartao.id).class]">
          {{ badgeStatusFatura(cartao.id).label }}
        </span>
      </div>

      <!-- Lista de despesas da fatura -->
      <div v-if="!despesasFatura(cartao.id).length" class="text-sm text-gray-400 py-2 text-center">
        Nenhuma despesa nesta fatura
      </div>
      <div v-else class="space-y-2">
        <div v-for="t in despesasFatura(cartao.id)" :key="t.id" class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
            :style="{ backgroundColor: t.categorias?.cor ?? '#9ca3af' }"
          >
            {{ (t.categorias?.nome ?? 'O')[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ t.descricao || t.categorias?.nome || '—' }}
            </p>
            <p class="text-xs text-gray-400">
              {{ formatarData(t.data) }}
              <span v-if="t.num_parcela" class="ml-1 text-primary-500">· parcela {{ t.num_parcela }}</span>
            </p>
          </div>
          <span
            v-if="t.status_pagamento === 'pago'"
            class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0"
          >pago</span>
          <!-- Mover fatura (só pendentes) -->
          <button
            v-if="t.status_pagamento !== 'pago'"
            @click="abrirMoverFatura(t, cartao)"
            class="p-1 rounded-lg hover:bg-primary-50 text-gray-300 hover:text-primary-500 transition-colors flex-shrink-0"
            title="Alterar fatura"
          >
            <ArrowRightLeftIcon class="w-3.5 h-3.5" />
          </button>
          <p class="text-danger font-semibold text-sm flex-shrink-0">-{{ formatarMoeda(t.valor) }}</p>
        </div>
      </div>

      <!-- Botão pagar fatura (só se há pendentes) -->
      <div v-if="temPendentes(cartao.id)" class="mt-4 pt-3 border-t border-gray-100">
        <button
          @click="abrirPagamentoFatura(cartao)"
          class="btn-primary w-full flex items-center justify-center gap-2"
        >
          <CheckCircleIcon class="w-4 h-4" />
          Pagar fatura {{ faturaLabel }}
        </button>
      </div>
    </div>

    <!-- Modal: mover transação para outra fatura -->
    <div
      v-if="moverFatura"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="moverFatura = null"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-1">Alterar fatura</h3>
        <p class="text-sm text-gray-500 mb-4 truncate">{{ moverFatura.transacao.descricao || moverFatura.transacao.categorias?.nome }}</p>

        <div class="mb-5">
          <label class="label text-sm">Mover para a fatura de</label>
          <select v-model="novaFaturaMove" class="input">
            <option v-for="opt in opcoesMoverFatura" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p v-if="vencimentoMoverFatura" class="text-xs text-primary-600 mt-1">Vence {{ vencimentoMoverFatura }}</p>
        </div>

        <div class="flex gap-3">
          <button @click="moverFatura = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarMoverFatura" :disabled="salvandoMove || novaFaturaMove === moverFatura.transacao.mes_fatura" class="btn-primary flex-1">
            {{ salvandoMove ? 'Salvando...' : 'Mover' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: importação de fatura CSV -->
    <ImportacaoFaturaModal
      v-if="importacaoAberta && cartaoImportacao"
      :cartao="cartaoImportacao"
      :mes-fatura="mesFaturaStr"
      @fechar="importacaoAberta = false"
      @importado="onImportado"
    />

    <!-- Form despesa rápida por cartão -->
    <TransacaoForm
      v-if="formDespesaAberto"
      :inicial="{ tipo: 'despesa', cartao_id: cartaoFormDespesa?.id }"
      @fechar="formDespesaAberto = false"
      @salvo="carregarFatura"
    />

    <!-- Modal: confirmar pagamento de fatura -->
    <div
      v-if="pagandoFatura"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="pagandoFatura = null"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-4 h-4 rounded-full flex-shrink-0" :style="{ backgroundColor: pagandoFatura.cor }"></div>
          <p class="font-semibold text-gray-900">{{ pagandoFatura.nome }}</p>
        </div>
        <p class="text-sm text-gray-500 mb-1 capitalize">Fatura {{ faturaLabel }}</p>
        <p class="text-danger font-bold text-lg mb-1">{{ formatarMoeda(totalFatura(pagandoFatura.id)) }}</p>
        <p class="text-xs text-gray-400 mb-4">
          {{ despesasPendentes(pagandoFatura.id).length }} despesa(s) pendente(s) serão marcadas como pagas.
        </p>

        <div class="mb-5">
          <label class="label text-sm">Data de pagamento</label>
          <input v-model="dataPagamentoFatura" type="date" class="input" />
        </div>

        <div class="flex gap-3">
          <button @click="pagandoFatura = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarPagamentoFatura" :disabled="salvandoPagamento" class="btn-primary flex-1">
            {{ salvandoPagamento ? 'Salvando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, CreditCardIcon, PlusIcon, CalendarIcon, CheckCircleIcon, ArrowRightLeftIcon, UploadIcon } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useCartoesStore, calcularVencimentoFatura, avancarMesFatura } from '@/stores/cartoes'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'
import { useCentrosCustoStore } from '@/stores/centrosCusto'
import TransacaoForm from '@/components/transacoes/TransacaoForm.vue'
import ImportacaoFaturaModal from '@/components/cartoes/ImportacaoFaturaModal.vue'

const cartoes    = useCartoesStore()
const transacoes = useTransacoesStore()
const categorias = useCategoriasStore()
const ccStore    = useCentrosCustoStore()

const hoje     = new Date()
const mesAtual = ref(hoje.getMonth() + 1)
const anoAtual = ref(hoje.getFullYear())
const carregando = ref(false)

// Todas as despesas da fatura selecionada (todos os cartões)
const despesasDoMes = ref([])

// Total pendente geral por cartão (todas as faturas, não só a selecionada)
const totalPendenteGeral = ref({}) // { [cartaoId]: number }

// Filtro de centro de custo
const filtroCC = ref('')

const despesasVisiveis = computed(() =>
  filtroCC.value
    ? despesasDoMes.value.filter(t => t.centro_custo_id === filtroCC.value)
    : despesasDoMes.value
)

const totalGeral = computed(() =>
  despesasVisiveis.value.reduce((s, t) => s + Number(t.valor), 0)
)
const totalPendenteFatura = computed(() =>
  despesasVisiveis.value.filter(t => t.status_pagamento === 'pendente').reduce((s, t) => s + Number(t.valor), 0)
)

const mesFaturaStr = computed(() =>
  `${anoAtual.value}-${String(mesAtual.value).padStart(2, '0')}-01`
)

const faturaLabel = computed(() =>
  new Date(anoAtual.value, mesAtual.value - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

// Despesas da fatura agrupadas por cartão (respeitando filtro CC)
function despesasFatura(cartaoId) {
  return despesasVisiveis.value.filter(t => t.cartao_id === cartaoId)
}

function totalFatura(cartaoId) {
  return despesasFatura(cartaoId).reduce((s, t) => s + Number(t.valor), 0)
}

function despesasPendentes(cartaoId) {
  return despesasFatura(cartaoId).filter(t => t.status_pagamento === 'pendente')
}

function temPendentes(cartaoId) {
  return despesasPendentes(cartaoId).length > 0
}

function badgeStatusFatura(cartaoId) {
  const lista = despesasFatura(cartaoId)
  if (!lista.length) return { label: 'SEM DESPESAS', class: 'bg-gray-100 text-gray-400' }
  const pendentes = lista.filter(t => t.status_pagamento === 'pendente')
  if (!pendentes.length) return { label: 'PAGA', class: 'bg-green-100 text-green-700' }
  if (pendentes.length < lista.length) return { label: 'PARCIAL', class: 'bg-yellow-100 text-yellow-700' }
  return { label: 'PENDENTE', class: 'bg-orange-100 text-orange-700' }
}

function vencimentoFatura(cartao) {
  const vencISO = calcularVencimentoFatura(mesFaturaStr.value, cartao)
  if (!vencISO) return null
  return new Date(vencISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

async function carregarFatura() {
  if (!cartoes.ativos.length) return
  carregando.value = true

  const ids = cartoes.ativos.map(c => c.id)

  const [{ data: faturaData }, { data: pendenteData }] = await Promise.all([
    supabase
      .from('transacoes')
      .select('*, categorias(nome, cor), centros_custo(nome, cor)')
      .eq('tipo', 'despesa')
      .eq('mes_fatura', mesFaturaStr.value)
      .in('cartao_id', ids)
      .order('data', { ascending: false }),
    supabase
      .from('transacoes')
      .select('cartao_id, valor')
      .eq('tipo', 'despesa')
      .eq('status_pagamento', 'pendente')
      .in('cartao_id', ids),
  ])

  despesasDoMes.value = faturaData ?? []

  const totais = {}
  for (const t of (pendenteData ?? [])) {
    totais[t.cartao_id] = (totais[t.cartao_id] ?? 0) + Number(t.valor)
  }
  totalPendenteGeral.value = totais

  carregando.value = false
}

async function mudarFatura(delta) {
  let m = mesAtual.value + delta
  let a = anoAtual.value
  if (m > 12) { m = 1; a++ }
  if (m < 1)  { m = 12; a-- }
  mesAtual.value = m
  anoAtual.value = a
  await carregarFatura()
}

// --- Mover transação para outra fatura ---
const moverFatura   = ref(null) // { transacao, cartao }
const novaFaturaMove = ref('')
const salvandoMove  = ref(false)

const opcoesMoverFatura = computed(() => {
  if (!moverFatura.value) return []
  const base = moverFatura.value.transacao.mes_fatura ?? mesFaturaStr.value
  const opts = []
  for (let i = -3; i <= 4; i++) {
    const d = new Date(base + 'T12:00:00')
    d.setMonth(d.getMonth() + i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const lbl = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const label = (val === base ? '★ ' : '') + lbl.charAt(0).toUpperCase() + lbl.slice(1)
    opts.push({ value: val, label })
  }
  return opts
})

const vencimentoMoverFatura = computed(() => {
  if (!moverFatura.value || !novaFaturaMove.value) return null
  const vencISO = calcularVencimentoFatura(novaFaturaMove.value, moverFatura.value.cartao)
  if (!vencISO) return null
  return new Date(vencISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
})

function abrirMoverFatura(transacao, cartao) {
  moverFatura.value = { transacao, cartao }
  novaFaturaMove.value = transacao.mes_fatura ?? mesFaturaStr.value
}

async function confirmarMoverFatura() {
  if (!moverFatura.value) return
  salvandoMove.value = true
  try {
    await transacoes.atualizarMesFatura(
      moverFatura.value.transacao.id,
      novaFaturaMove.value,
      moverFatura.value.cartao,
    )
    // Remove da lista atual (mudou de fatura)
    despesasDoMes.value = despesasDoMes.value.filter(t => t.id !== moverFatura.value.transacao.id)
    moverFatura.value = null
  } finally {
    salvandoMove.value = false
  }
}

// --- Importação de fatura ---
const importacaoAberta  = ref(false)
const cartaoImportacao  = ref(null)

function abrirImportacao(cartao) {
  cartaoImportacao.value = cartao
  importacaoAberta.value = true
}

async function onImportado() {
  importacaoAberta.value = false
  await carregarFatura()
}

// --- Despesa rápida por cartão ---
const formDespesaAberto = ref(false)
const cartaoFormDespesa = ref(null)

function abrirFormDespesa(cartao) {
  cartaoFormDespesa.value = cartao
  formDespesaAberto.value = true
}

// --- Pagamento de fatura ---
const pagandoFatura       = ref(null)
const dataPagamentoFatura = ref('')
const salvandoPagamento   = ref(false)

function abrirPagamentoFatura(cartao) {
  pagandoFatura.value = cartao
  dataPagamentoFatura.value = new Date().toISOString().split('T')[0]
}

async function confirmarPagamentoFatura() {
  if (!pagandoFatura.value) return
  salvandoPagamento.value = true
  try {
    await transacoes.pagarFaturaCartao(
      pagandoFatura.value.id,
      mesFaturaStr.value,
      dataPagamentoFatura.value,
    )
    // Atualiza estado local
    despesasDoMes.value
      .filter(t => t.cartao_id === pagandoFatura.value.id && t.status_pagamento === 'pendente')
      .forEach(t => { t.status_pagamento = 'pago'; t.data_pagamento = dataPagamentoFatura.value })
    pagandoFatura.value = null
  } finally {
    salvandoPagamento.value = false
  }
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

onMounted(async () => {
  await Promise.all([cartoes.carregar(), categorias.carregar(), ccStore.carregar()])
  await carregarFatura()
})
</script>
