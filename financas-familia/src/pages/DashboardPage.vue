<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">
      Olá, {{ primeiroNome }}
    </h1>

    <!-- Saldo do mês -->
    <div :class="['rounded-2xl p-5 text-center shadow-sm', saldo >= 0 ? 'bg-success' : 'bg-danger']">
      <p class="text-white/80 text-sm mb-1 capitalize">{{ mesLabel }}</p>
      <p class="text-white text-3xl font-bold">{{ formatarMoeda(saldo) }}</p>
      <div class="flex justify-center gap-6 mt-3">
        <div class="text-center">
          <p class="text-white/70 text-xs">Receitas</p>
          <p class="text-white font-semibold text-sm">{{ formatarMoeda(transacoes.totalReceitas) }}</p>
        </div>
        <div class="w-px bg-white/20"></div>
        <div class="text-center">
          <p class="text-white/70 text-xs">Despesas</p>
          <p class="text-white font-semibold text-sm">{{ formatarMoeda(transacoes.totalDespesas) }}</p>
        </div>
      </div>
    </div>

    <!-- Ações rápidas -->
    <div class="grid grid-cols-2 gap-3">
      <button
        @click="abrirForm('despesa')"
        class="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-danger font-semibold text-sm hover:bg-red-100 active:scale-95 transition-all"
      >
        <PlusIcon class="w-4 h-4" />
        Nova Despesa
      </button>
      <button
        @click="abrirForm('receita')"
        class="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-50 border border-green-100 text-success font-semibold text-sm hover:bg-green-100 active:scale-95 transition-all"
      >
        <PlusIcon class="w-4 h-4" />
        Nova Receita
      </button>
    </div>

    <!-- Gráfico de categorias -->
    <GraficoCategorias :transacoes="transacoes.transacoes" />

    <!-- Gráfico de cartões -->
    <GraficoCartoes :transacoes="transacoes.transacoes" :cartoes="cartoesList" />

    <!-- Orçamentos com progresso -->
    <div v-if="orcamentos.orcamentos.length" class="card">
      <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <TargetIcon class="w-4 h-4 text-primary-600" />
        Orçamentos do mês
      </h2>
      <div class="space-y-3">
        <div v-for="orc in orcamentos.orcamentos" :key="orc.id">
          <div class="flex justify-between mb-1">
            <span class="text-sm text-gray-700">{{ orc.categorias?.nome }}</span>
            <span class="text-xs text-gray-500">
              {{ formatarMoeda(gastosPorCategoria[orc.categoria_id] ?? 0) }} / {{ formatarMoeda(orc.valor_limite) }}
            </span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="pct(orc) >= 100 ? 'bg-danger' : pct(orc) >= 80 ? 'bg-warning' : 'bg-success'"
              :style="{ width: Math.min(pct(orc), 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximas parcelas -->
    <div class="card">
      <h2 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <CalendarIcon class="w-4 h-4 text-primary-600" />
        Parcelas nos próximos 30 dias
      </h2>
      <div v-if="!parcelasProximas.length" class="text-sm text-gray-400 py-1">
        Nenhuma parcela a vencer.
      </div>
      <div v-else class="space-y-2">
        <div v-for="p in parcelasProximas" :key="p.id" class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ p.descricao }}</p>
            <p class="text-xs text-gray-400">{{ formatarData(p.data) }}</p>
          </div>
          <p class="text-danger font-semibold text-sm">-{{ formatarMoeda(p.valor) }}</p>
        </div>
      </div>
    </div>

    <!-- Comparativo mês a mês -->
    <GraficoComparativo />

    <!-- Projeção futura -->
    <ProjecaoFutura />

    <!-- Link lançamentos -->
    <RouterLink to="/lancamentos" class="card flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <span class="text-sm font-medium text-primary-600">Ver todos os lançamentos</span>
      <ChevronRightIcon class="w-4 h-4 text-primary-600" />
    </RouterLink>

    <TransacaoForm v-if="formAberto" :inicial="{ tipo: tipoInicial }" @fechar="formAberto = false" @salvo="carregar" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CalendarIcon, ChevronRightIcon, PlusIcon, TargetIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'
import { useOrcamentosStore } from '@/stores/orcamentos'
import { useNotificacoesStore } from '@/stores/notificacoes'
import { useCartoesStore } from '@/stores/cartoes'
import GraficoCategorias from '@/components/dashboard/GraficoCategorias.vue'
import GraficoCartoes from '@/components/dashboard/GraficoCartoes.vue'
import GraficoComparativo from '@/components/dashboard/GraficoComparativo.vue'
import ProjecaoFutura from '@/components/dashboard/ProjecaoFutura.vue'
import TransacaoForm from '@/components/transacoes/TransacaoForm.vue'

const auth         = useAuthStore()
const transacoes   = useTransacoesStore()
const categorias   = useCategoriasStore()
const orcamentos   = useOrcamentosStore()
const notificacoes = useNotificacoesStore()
const cartoesStore = useCartoesStore()
const cartoesList  = computed(() => cartoesStore.cartoes)
const formAberto   = ref(false)
const tipoInicial  = ref('despesa')

function abrirForm(tipo) {
  tipoInicial.value = tipo
  formAberto.value  = true
}

const hoje = new Date()
const mes  = hoje.getMonth() + 1
const ano  = hoje.getFullYear()

const primeiroNome = computed(() => auth.user?.user_metadata?.full_name?.split(' ')[0] ?? 'você')
const saldo        = computed(() => transacoes.saldo)
const mesLabel     = computed(() => hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))

const parcelasProximas = computed(() => {
  const limite = new Date()
  limite.setDate(limite.getDate() + 30)
  return transacoes.transacoes
    .filter(t => {
      const d = new Date(t.data + 'T12:00:00')
      return t.parcelamento_id && d >= hoje && d <= limite
    })
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5)
})

const gastosPorCategoria = computed(() => {
  const map = {}
  transacoes.transacoes.filter(t => t.tipo === 'despesa').forEach(t => {
    map[t.categoria_id] = (map[t.categoria_id] ?? 0) + Number(t.valor)
  })
  return map
})

function pct(orc) {
  return Math.round(((gastosPorCategoria.value[orc.categoria_id] ?? 0) / orc.valor_limite) * 100)
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

async function carregar() {
  await categorias.carregar()
  await cartoesStore.carregar()
  await transacoes.carregar(mes, ano)
  await orcamentos.carregar(mes, ano)
  // Gera alertas de orçamento no sino
  await notificacoes.gerarAlertas({
    orcamentos: orcamentos.orcamentos,
    transacoesMes: transacoes.transacoes,
  })
}

onMounted(carregar)
</script>
