<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">Pagamentos</h1>

    <!-- Loading skeleton -->
    <div v-if="carregando" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card animate-pulse h-16"></div>
    </div>

    <template v-else>
      <!-- Atrasadas -->
      <div v-if="atrasadas.length" class="card">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-gray-900 text-sm">Atrasadas</h2>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{{ atrasadas.length }}</span>
        </div>
        <ListaItens :itens="atrasadas" cor-badge="bg-red-100 text-red-700" :label-badge="(t) => `${diasAtraso(t)}d atraso`" :formatar-moeda="formatarMoeda" :formatar-data="formatarData" @pagar="abrirConfirmacao" />
      </div>

      <!-- Vencem hoje -->
      <div v-if="hoje_.length" class="card">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-gray-900 text-sm">Vencem hoje</h2>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{{ hoje_.length }}</span>
        </div>
        <ListaItens :itens="hoje_" cor-badge="bg-orange-100 text-orange-700" :label-badge="() => 'HOJE'" :formatar-moeda="formatarMoeda" :formatar-data="formatarData" @pagar="abrirConfirmacao" />
      </div>

      <!-- Próximos 7 dias -->
      <div v-if="proximos7.length" class="card">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-gray-900 text-sm">Próximos 7 dias</h2>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{{ proximos7.length }}</span>
        </div>
        <ListaItens :itens="proximos7" cor-badge="bg-yellow-100 text-yellow-700" :label-badge="(t) => `${diasParaVencer(t)}d`" :formatar-moeda="formatarMoeda" :formatar-data="formatarData" @pagar="abrirConfirmacao" />
      </div>

      <!-- Próximos 30 dias -->
      <div v-if="proximos30.length" class="card">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-gray-900 text-sm">Próximos 30 dias</h2>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ proximos30.length }}</span>
        </div>
        <ListaItens :itens="proximos30" cor-badge="bg-gray-100 text-gray-600" :label-badge="(t) => `${diasParaVencer(t)}d`" :formatar-moeda="formatarMoeda" :formatar-data="formatarData" @pagar="abrirConfirmacao" />
      </div>

      <!-- Tudo em dia -->
      <div
        v-if="!atrasadas.length && !hoje_.length && !proximos7.length && !proximos30.length"
        class="card text-center py-12 text-gray-400"
      >
        <CheckCircleIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm">Nenhuma despesa pendente!</p>
      </div>

      <!-- Faturas de cartão -->
      <div v-if="faturasCartao.length" class="card">
        <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CreditCardIcon class="w-4 h-4 text-primary-600" />
          Faturas de cartão pendentes
        </h2>
        <div class="space-y-3">
          <div v-for="fatura in faturasCartao" :key="fatura.key" class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: fatura.cor }"></div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ fatura.cartaoNome }}</p>
                <p class="text-xs text-gray-400 capitalize">{{ fatura.mesLabel }} · {{ fatura.count }} despesa(s)</p>
              </div>
            </div>
            <p class="text-danger font-semibold text-sm flex-shrink-0">{{ formatarMoeda(fatura.total) }}</p>
            <button
              @click="abrirConfirmacaoFatura(fatura)"
              :disabled="pagandoFatura === fatura.key"
              class="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
            >
              {{ pagandoFatura === fatura.key ? '...' : 'Pagar fatura' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagas recentes -->
      <div v-if="pagas.length" class="card">
        <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircleIcon class="w-4 h-4 text-success" />
          Pagas recentemente
        </h2>
        <div class="space-y-2">
          <div v-for="t in pagas" :key="t.id" class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              :style="{ backgroundColor: t.categorias?.cor ?? '#9ca3af' }"
            >
              {{ (t.categorias?.nome ?? 'O')[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ t.descricao || t.categorias?.nome || '—' }}</p>
              <p class="text-xs text-gray-400">Pago em {{ formatarData(t.data_pagamento) }}</p>
            </div>
            <p class="text-success font-semibold text-sm flex-shrink-0">{{ formatarMoeda(t.valor) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: Confirmar pagamento avulso -->
    <div
      v-if="confirmando"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="confirmando = null"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            :style="{ backgroundColor: confirmando.categorias?.cor ?? '#9ca3af' }"
          >
            {{ (confirmando.categorias?.nome ?? 'O')[0] }}
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ confirmando.descricao || confirmando.categorias?.nome || 'Despesa' }}</p>
            <p class="text-danger font-bold">{{ formatarMoeda(confirmando.valor) }}</p>
          </div>
        </div>

        <div class="mb-4">
          <label class="label text-sm">Data de pagamento</label>
          <input v-model="dataConfirmacao" type="date" class="input" />
        </div>

        <div class="flex gap-3">
          <button @click="confirmando = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarPagamento" :disabled="pagando" class="btn-primary flex-1">
            {{ pagando ? 'Salvando...' : 'Confirmar pagamento' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmar pagamento de fatura -->
    <div
      v-if="confirmandoFatura"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="confirmandoFatura = null"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: confirmandoFatura.cor }"></div>
          <p class="font-semibold text-gray-900">{{ confirmandoFatura.cartaoNome }}</p>
        </div>
        <p class="text-sm text-gray-500 mb-1 capitalize">{{ confirmandoFatura.mesLabel }}</p>
        <p class="text-danger font-bold text-lg mb-4">{{ formatarMoeda(confirmandoFatura.total) }}</p>
        <p class="text-xs text-gray-400 mb-4">Todas as {{ confirmandoFatura.count }} despesa(s) desta fatura serão marcadas como pagas.</p>

        <div class="mb-4">
          <label class="label text-sm">Data de pagamento</label>
          <input v-model="dataConfirmacaoFatura" type="date" class="input" />
        </div>

        <div class="flex gap-3">
          <button @click="confirmandoFatura = null" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarPagamentoFatura" :disabled="pagandoFatura !== null" class="btn-primary flex-1">
            {{ pagandoFatura ? 'Salvando...' : 'Pagar fatura' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { CheckCircleIcon, CreditCardIcon } from 'lucide-vue-next'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCartoesStore } from '@/stores/cartoes'

const transacoes = useTransacoesStore()
const cartoes    = useCartoesStore()

const carregando         = ref(false)
const pendentes          = ref([])
const pagas              = ref([])
const confirmando        = ref(null)
const dataConfirmacao    = ref('')
const pagando            = ref(false)
const confirmandoFatura  = ref(null)
const dataConfirmacaoFatura = ref('')
const pagandoFatura      = ref(null)

const hoje = new Date()
hoje.setHours(0, 0, 0, 0)
const hojeStr = new Date().toISOString().split('T')[0]

function diasAtraso(t) {
  const d = new Date(t.data_vencimento + 'T12:00:00')
  return Math.round((hoje - d) / (1000 * 60 * 60 * 24))
}

function diasParaVencer(t) {
  const d = new Date(t.data_vencimento + 'T12:00:00')
  return Math.round((d - hoje) / (1000 * 60 * 60 * 24))
}

const atrasadas = computed(() =>
  pendentes.value.filter(t => {
    const d = new Date(t.data_vencimento + 'T12:00:00')
    return d < hoje
  })
)

const hoje_ = computed(() =>
  pendentes.value.filter(t => {
    const d = new Date(t.data_vencimento + 'T12:00:00')
    return d.getTime() === hoje.getTime()
  })
)

const proximos7 = computed(() => {
  const limite = new Date(hoje)
  limite.setDate(limite.getDate() + 7)
  return pendentes.value.filter(t => {
    const d = new Date(t.data_vencimento + 'T12:00:00')
    return d > hoje && d <= limite
  })
})

const proximos30 = computed(() => {
  const limite7  = new Date(hoje); limite7.setDate(limite7.getDate() + 7)
  const limite30 = new Date(hoje); limite30.setDate(limite30.getDate() + 30)
  return pendentes.value.filter(t => {
    const d = new Date(t.data_vencimento + 'T12:00:00')
    return d > limite7 && d <= limite30
  })
})

const faturasCartao = computed(() => {
  const map = {}
  pendentes.value.forEach(t => {
    if (!t.cartao_id || !t.mes_fatura) return
    const key = `${t.cartao_id}_${t.mes_fatura}`
    if (!map[key]) {
      const cartao = cartoes.cartoes.find(c => c.id === t.cartao_id)
      const d = new Date(t.mes_fatura + 'T12:00:00')
      map[key] = {
        key,
        cartaoId:   t.cartao_id,
        mesFatura:  t.mes_fatura,
        cartaoNome: cartao?.nome ?? 'Cartão',
        cor:        cartao?.cor ?? '#6366f1',
        mesLabel:   d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        total:      0,
        count:      0,
      }
    }
    map[key].total += Number(t.valor)
    map[key].count++
  })
  return Object.values(map).sort((a, b) => a.mesFatura.localeCompare(b.mesFatura))
})

function abrirConfirmacao(transacao) {
  confirmando.value = transacao
  dataConfirmacao.value = hojeStr
}

async function confirmarPagamento() {
  pagando.value = true
  try {
    await transacoes.marcarPago(confirmando.value.id, dataConfirmacao.value)
    pendentes.value = pendentes.value.filter(t => t.id !== confirmando.value.id)
    pagas.value = await transacoes.carregarPagas()
    confirmando.value = null
  } finally {
    pagando.value = false
  }
}

function abrirConfirmacaoFatura(fatura) {
  confirmandoFatura.value = fatura
  dataConfirmacaoFatura.value = hojeStr
}

async function confirmarPagamentoFatura() {
  pagandoFatura.value = confirmandoFatura.value.key
  try {
    await transacoes.pagarFaturaCartao(
      confirmandoFatura.value.cartaoId,
      confirmandoFatura.value.mesFatura,
      dataConfirmacaoFatura.value,
    )
    await recarregar()
    confirmandoFatura.value = null
  } finally {
    pagandoFatura.value = null
  }
}

async function recarregar() {
  ;[pendentes.value, pagas.value] = await Promise.all([
    transacoes.carregarPendentes(),
    transacoes.carregarPagas(),
  ])
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

onMounted(async () => {
  carregando.value = true
  await cartoes.carregar()
  await recarregar()
  carregando.value = false
})

// Componente inline para lista de itens por seção
const ListaItens = defineComponent({
  name: 'ListaItens',
  props: {
    itens: Array,
    corBadge: String,
    labelBadge: Function,
    formatarMoeda: Function,
    formatarData: Function,
  },
  emits: ['pagar'],
  setup(props, { emit }) {
    return () => h('div', { class: 'space-y-2' },
      props.itens.map(t =>
        h('div', { key: t.id, class: 'flex items-center gap-2' }, [
          h('div', {
            class: 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
            style: { backgroundColor: t.categorias?.cor ?? '#9ca3af' },
          }, (t.categorias?.nome ?? 'O')[0]),
          h('div', { class: 'flex-1 min-w-0' }, [
            h('p', { class: 'text-sm font-medium text-gray-900 truncate' }, t.descricao || t.categorias?.nome || '—'),
            h('p', { class: 'text-xs text-gray-400' }, props.formatarData(t.data_vencimento)),
          ]),
          h('span', {
            class: `text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${props.corBadge}`,
          }, props.labelBadge(t)),
          h('p', { class: 'text-danger font-semibold text-sm flex-shrink-0' }, `-${props.formatarMoeda(t.valor)}`),
          h('button', {
            class: 'btn-primary text-xs py-1 px-2 flex-shrink-0',
            onClick: () => emit('pagar', t),
          }, 'Pagar'),
        ])
      )
    )
  },
})
</script>
