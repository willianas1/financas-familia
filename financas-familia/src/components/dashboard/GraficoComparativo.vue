<template>
  <div class="card">
    <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <BarChart2Icon class="w-4 h-4 text-primary-600" />
      Comparativo dos últimos 6 meses
    </h2>
    <div v-if="carregando" class="h-48 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else-if="!temDados" class="text-sm text-gray-400 py-4 text-center">
      Dados insuficientes para comparativo.
    </div>
    <div v-else>
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { BarChart2Icon } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  centrosCustoId: { type: String, default: '' },
})

const auth       = useAuthStore()
const carregando = ref(true)
const historico  = ref([])

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

onMounted(async () => {
  const hoje  = new Date()
  const meses = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
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
    return { label, receitas, despesas }
  }))

  historico.value  = resultados
  carregando.value = false
})

const temDados = computed(() => historico.value.some(h => h.receitas > 0 || h.despesas > 0))

const chartData = computed(() => ({
  labels: historico.value.map(h => h.label),
  datasets: [
    {
      label:           'Receitas',
      data:            historico.value.map(h => h.receitas),
      backgroundColor: '#22c55e',
      borderRadius:    4,
    },
    {
      label:           'Despesas',
      data:            historico.value.map(h => h.despesas),
      backgroundColor: '#ef4444',
      borderRadius:    4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: ctx => ` ${Number(ctx.raw).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: v => `R$ ${Number(v).toLocaleString('pt-BR')}`,
        font: { size: 10 },
      },
      grid: { color: '#f3f4f6' },
    },
    x: { grid: { display: false } },
  },
}
</script>
