<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-900">Orçamentos</h1>
    </div>

    <!-- Seletor de mês -->
    <div class="card mb-4 flex items-center justify-between p-3">
      <button @click="mudarMes(-1)" class="p-2 rounded-lg hover:bg-gray-100">
        <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
      </button>
      <span class="font-semibold text-gray-900 capitalize">{{ mesLabel }}</span>
      <button @click="mudarMes(1)" class="p-2 rounded-lg hover:bg-gray-100">
        <ChevronRightIcon class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse h-20"></div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="cat in categoriasDespesa"
        :key="cat.id"
        class="card"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                 :style="{ backgroundColor: cat.cor }">
              {{ cat.nome[0] }}
            </div>
            <span class="text-sm font-medium text-gray-900">{{ cat.nome }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ formatarMoeda(gastosPorCategoria[cat.id] ?? 0) }} /</span>
            <input
              :value="orcamentoPorCategoria[cat.id] ?? ''"
              @change="salvarOrcamento(cat.id, $event.target.value)"
              type="number"
              min="0"
              step="10"
              class="w-24 text-right text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Sem limite"
            />
          </div>
        </div>

        <!-- Barra de progresso -->
        <div v-if="orcamentoPorCategoria[cat.id]" class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="percentual(cat.id) >= 100 ? 'bg-danger' : percentual(cat.id) >= 80 ? 'bg-warning' : 'bg-success'"
            :style="{ width: Math.min(percentual(cat.id), 100) + '%' }"
          ></div>
        </div>
        <p v-if="orcamentoPorCategoria[cat.id]" class="text-xs text-gray-400 mt-1 text-right">
          {{ percentual(cat.id) }}% utilizado
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import { useCategoriasStore } from '@/stores/categorias'
import { useOrcamentosStore } from '@/stores/orcamentos'
import { useTransacoesStore } from '@/stores/transacoes'

const cats       = useCategoriasStore()
const orcamentos = useOrcamentosStore()
const transacoes = useTransacoesStore()
const loading    = ref(false)

const hoje    = new Date()
const mes     = ref(hoje.getMonth() + 1)
const ano     = ref(hoje.getFullYear())

const mesLabel = computed(() =>
  new Date(ano.value, mes.value - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

const categoriasDespesa = computed(() => cats.despesas)

const orcamentoPorCategoria = computed(() => {
  const map = {}
  orcamentos.orcamentos.forEach(o => { map[o.categoria_id] = o.valor_limite })
  return map
})

const gastosPorCategoria = computed(() => {
  const map = {}
  transacoes.transacoes.filter(t => t.tipo === 'despesa').forEach(t => {
    map[t.categoria_id] = (map[t.categoria_id] ?? 0) + Number(t.valor)
  })
  return map
})

function percentual(catId) {
  const limite = orcamentoPorCategoria.value[catId]
  if (!limite) return 0
  return Math.round(((gastosPorCategoria.value[catId] ?? 0) / limite) * 100)
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function salvarOrcamento(categoria_id, valor) {
  const v = parseFloat(valor)
  if (!v || v <= 0) return
  await orcamentos.salvar({ categoria_id, valor_limite: v, mes: mes.value, ano: ano.value })
}

async function mudarMes(delta) {
  let m = mes.value + delta
  let a = ano.value
  if (m > 12) { m = 1; a++ }
  if (m < 1)  { m = 12; a-- }
  mes.value = m
  ano.value = a
  await carregar()
}

async function carregar() {
  loading.value = true
  await Promise.all([
    cats.carregar(),
    orcamentos.carregar(mes.value, ano.value),
    transacoes.carregar(mes.value, ano.value),
  ])
  loading.value = false
}

onMounted(carregar)
</script>
