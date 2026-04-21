<template>
  <div class="card">
    <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <PieChartIcon class="w-4 h-4 text-primary-600" />
      Gastos por categoria
    </h2>
    <div v-if="!dados.length" class="text-sm text-gray-400 py-4 text-center">
      Nenhum gasto registrado este mês.
    </div>
    <div v-else class="flex flex-col sm:flex-row items-center gap-4">
      <div class="w-44 h-44 flex-shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
      <div class="flex-1 w-full space-y-2">
        <div v-for="item in dados" :key="item.nome" class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: item.cor }"></div>
          <span class="text-sm text-gray-700 flex-1 truncate">{{ item.nome }}</span>
          <span class="text-sm font-semibold text-gray-900">{{ formatarMoeda(item.total) }}</span>
          <span class="text-xs text-gray-400 w-10 text-right">{{ item.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { PieChartIcon } from 'lucide-vue-next'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  transacoes: { type: Array, default: () => [] },
})

const dados = computed(() => {
  const map = {}
  props.transacoes
    .filter(t => t.tipo === 'despesa')
    .forEach(t => {
      const id = t.categoria_id ?? 'outros'
      if (!map[id]) map[id] = { nome: t.categorias?.nome ?? 'Outros', cor: t.categorias?.cor ?? '#9ca3af', total: 0 }
      map[id].total += Number(t.valor)
    })
  const lista  = Object.values(map).sort((a, b) => b.total - a.total)
  const soma   = lista.reduce((s, i) => s + i.total, 0)
  return lista.map(i => ({ ...i, pct: soma ? Math.round((i.total / soma) * 100) : 0 }))
})

const chartData = computed(() => ({
  labels:   dados.value.map(d => d.nome),
  datasets: [{
    data:            dados.value.map(d => d.total),
    backgroundColor: dados.value.map(d => d.cor),
    borderWidth:     2,
    borderColor:     '#ffffff',
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: ctx => ` ${Number(ctx.raw).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      },
    },
  },
  cutout: '65%',
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>
