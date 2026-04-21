<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">Cartões de crédito</h1>

    <!-- Seletor de mês -->
    <div class="card flex items-center justify-between p-3">
      <button @click="mudarMes(-1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <span class="font-semibold text-gray-900 capitalize">{{ mesLabel }}</span>
      <button @click="mudarMes(1)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ChevronRightIcon class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <!-- Sem cartões cadastrados -->
    <div v-if="!cartoes.cartoes.length" class="card text-center py-12 text-gray-400">
      <CreditCardIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">Nenhum cartão cadastrado</p>
      <RouterLink to="/configuracoes" class="text-primary-600 text-sm mt-2 inline-block hover:underline">
        Adicionar em Configurações
      </RouterLink>
    </div>

    <!-- Cards por cartão -->
    <div v-for="cartao in cartoes.ativos" :key="cartao.id" class="card overflow-hidden">
      <!-- Header clicável -->
      <button
        class="flex items-center justify-between w-full p-4 -mx-5 -mt-5 mb-4 text-left"
        :style="{ backgroundColor: cartao.cor }"
        @click="abrirDetalhe(cartao)"
      >
        <div class="flex items-center gap-3">
          <CreditCardIcon class="w-5 h-5 text-white/80" />
          <div>
            <p class="font-bold text-white">{{ cartao.nome }}</p>
            <p class="text-white/70 text-xs capitalize">
              {{ cartao.bandeira || 'cartão' }}
              <span v-if="cartao.ultimos_digitos">·· {{ cartao.ultimos_digitos }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-white/70 text-xs">Total no mês</p>
            <p class="text-white font-bold text-lg">{{ formatarMoeda(totalPorCartao[cartao.id] ?? 0) }}</p>
          </div>
          <ChevronRightIcon class="w-4 h-4 text-white/60" />
        </div>
      </button>

      <!-- Lista de despesas do mês -->
      <div v-if="!despesasPorCartao[cartao.id]?.length" class="text-sm text-gray-400 py-2 text-center">
        Nenhuma despesa neste mês
      </div>
      <div v-else class="space-y-2">
        <div v-for="t in despesasPorCartao[cartao.id]" :key="t.id" class="flex items-center gap-3">
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
          <p class="text-danger font-semibold text-sm flex-shrink-0">-{{ formatarMoeda(t.valor) }}</p>
        </div>
      </div>
    </div>

    <!-- Drawer: detalhe total do cartão -->
    <Transition name="drawer">
      <div
        v-if="cartaoAberto"
        class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
        @click.self="cartaoAberto = null"
      >
        <div class="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col">
          <!-- Header colorido -->
          <div
            class="flex items-center justify-between px-5 py-4 rounded-t-3xl flex-shrink-0"
            :style="{ backgroundColor: cartaoAberto.cor }"
          >
            <div>
              <p class="font-bold text-white text-lg">{{ cartaoAberto.nome }}</p>
              <p class="text-white/70 text-sm capitalize">
                {{ cartaoAberto.bandeira || 'cartão' }}
                <span v-if="cartaoAberto.ultimos_digitos">·· {{ cartaoAberto.ultimos_digitos }}</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-white/70 text-xs">Dívida total</p>
              <p class="text-white font-bold text-2xl">{{ formatarMoeda(totalDetalhe) }}</p>
            </div>
          </div>

          <!-- Conteúdo rolável -->
          <div class="overflow-y-auto flex-1 px-5 py-4">
            <div v-if="carregandoDetalhe" class="space-y-2 py-4">
              <div v-for="i in 4" :key="i" class="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>

            <div v-else-if="!gruposMeses.length" class="text-center py-8 text-gray-400 text-sm">
              Nenhuma despesa vinculada a este cartão.
            </div>

            <div v-else class="space-y-5">
              <div v-for="grupo in gruposMeses" :key="grupo.label">
                <!-- Cabeçalho do mês -->
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">
                    {{ grupo.label }}
                  </span>
                  <span class="text-xs font-semibold text-danger">{{ formatarMoeda(grupo.total) }}</span>
                </div>
                <!-- Transações do mês -->
                <div class="space-y-2">
                  <div v-for="t in grupo.transacoes" :key="t.id" class="flex items-center gap-3">
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
                    <p class="text-danger font-semibold text-sm flex-shrink-0">-{{ formatarMoeda(t.valor) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-5 pb-6 pt-2 flex-shrink-0">
            <button @click="cartaoAberto = null" class="btn-secondary w-full">Fechar</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, CreditCardIcon } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useCartoesStore } from '@/stores/cartoes'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'

const cartoes    = useCartoesStore()
const transacoes = useTransacoesStore()
const categorias = useCategoriasStore()

const hoje     = new Date()
const mesAtual = ref(hoje.getMonth() + 1)
const anoAtual = ref(hoje.getFullYear())

const mesLabel = computed(() =>
  new Date(anoAtual.value, mesAtual.value - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

const despesasPorCartao = computed(() => {
  const map = {}
  transacoes.transacoes
    .filter(t => t.tipo === 'despesa' && t.cartao_id)
    .forEach(t => {
      if (!map[t.cartao_id]) map[t.cartao_id] = []
      map[t.cartao_id].push(t)
    })
  return map
})

const totalPorCartao = computed(() => {
  const map = {}
  Object.entries(despesasPorCartao.value).forEach(([id, lista]) => {
    map[id] = lista.reduce((s, t) => s + Number(t.valor), 0)
  })
  return map
})

// --- Detalhe total do cartão ---
const cartaoAberto      = ref(null)
const carregandoDetalhe = ref(false)
const todasTransacoes   = ref([])

const totalDetalhe = computed(() =>
  todasTransacoes.value.reduce((s, t) => s + Number(t.valor), 0)
)

const gruposMeses = computed(() => {
  const map = {}
  todasTransacoes.value.forEach(t => {
    const d   = new Date(t.data + 'T12:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), total: 0, transacoes: [] }
    map[key].total += Number(t.valor)
    map[key].transacoes.push(t)
  })
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v)
})

async function abrirDetalhe(cartao) {
  cartaoAberto.value      = cartao
  carregandoDetalhe.value = true
  todasTransacoes.value   = []

  const { data } = await supabase
    .from('transacoes')
    .select('*, categorias(nome, cor)')
    .eq('cartao_id', cartao.id)
    .eq('tipo', 'despesa')
    .order('data', { ascending: false })

  todasTransacoes.value   = data ?? []
  carregandoDetalhe.value = false
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso) {
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

onMounted(async () => {
  await Promise.all([
    cartoes.carregar(),
    categorias.carregar(),
    transacoes.carregar(mesAtual.value, anoAtual.value),
  ])
})
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-active .bg-white,
.drawer-leave-active .bg-white {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
