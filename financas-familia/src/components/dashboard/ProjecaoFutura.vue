<template>
  <div class="card">
    <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <TrendingUpIcon class="w-4 h-4 text-primary-600" />
      Projeção dos próximos meses
    </h2>
    <div v-if="carregando" class="h-24 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else class="grid grid-cols-3 gap-2">
      <div
        v-for="mes in projecao"
        :key="mes.label"
        :class="['rounded-xl p-3 text-center', mes.saldo >= 0 ? 'bg-green-50' : 'bg-red-50']"
      >
        <p class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{{ mes.label }}</p>
        <p :class="['font-bold text-sm', mes.saldo >= 0 ? 'text-success' : 'text-danger']">
          {{ formatarMoeda(mes.saldo) }}
        </p>
        <div class="mt-1.5 space-y-0.5">
          <p class="text-xs text-gray-400">↑ {{ formatarMoeda(mes.receitas) }}</p>
          <p class="text-xs text-gray-400">↓ {{ formatarMoeda(mes.despesas) }}</p>
        </div>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-3">
      Baseado em lançamentos já registrados (recorrentes e parcelas futuras).
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TrendingUpIcon } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  centrosCustoId: { type: String, default: '' },
})

const auth       = useAuthStore()
const carregando = ref(true)
const projecao   = ref([])

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

onMounted(async () => {
  const hoje  = new Date()
  const meses = []
  for (let i = 1; i <= 3; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    meses.push({ mes: d.getMonth() + 1, ano: d.getFullYear(), label: MESES[d.getMonth()] })
  }

  const resultados = await Promise.all(meses.map(async ({ mes, ano, label }) => {
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim    = new Date(ano, mes, 0).toISOString().split('T')[0]

    // Receitas por data de lançamento
    const { data: rd } = await supabase
      .from('transacoes')
      .select('valor')
      .eq('familia_id', auth.familiaId)
      .eq('tipo', 'receita')
      .gte('data', inicio)
      .lte('data', fim)

    // Despesas por data de vencimento (com filtro CC opcional)
    let qDespesas = supabase
      .from('transacoes')
      .select('valor')
      .eq('familia_id', auth.familiaId)
      .eq('tipo', 'despesa')
      .not('data_vencimento', 'is', null)
      .gte('data_vencimento', inicio)
      .lte('data_vencimento', fim)

    if (props.centrosCustoId) qDespesas = qDespesas.eq('centro_custo_id', props.centrosCustoId)

    const { data: dd } = await qDespesas

    const receitas = (rd ?? []).reduce((s, t) => s + Number(t.valor), 0)
    const despesas = (dd ?? []).reduce((s, t) => s + Number(t.valor), 0)
    return { label, receitas, despesas, saldo: receitas - despesas }
  }))

  projecao.value   = resultados
  carregando.value = false
})

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>
