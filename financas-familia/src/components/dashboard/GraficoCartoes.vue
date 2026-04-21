<template>
  <div v-if="dados.length" class="card">
    <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <CreditCardIcon class="w-4 h-4 text-primary-600" />
      Gastos por cartão
    </h2>
    <div class="space-y-3">
      <div v-for="item in dados" :key="item.id">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: item.cor }"></div>
            <span class="text-sm text-gray-700">{{ item.nome }}</span>
          </div>
          <span class="text-sm font-semibold text-gray-900">{{ formatarMoeda(item.total) }}</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: item.pct + '%', backgroundColor: item.cor }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CreditCardIcon } from 'lucide-vue-next'

const props = defineProps({
  transacoes: { type: Array, default: () => [] },
  cartoes:    { type: Array, default: () => [] },
})

const dados = computed(() => {
  const map = {}
  props.transacoes
    .filter(t => t.tipo === 'despesa' && t.cartao_id)
    .forEach(t => {
      if (!map[t.cartao_id]) {
        const c = props.cartoes.find(c => c.id === t.cartao_id)
        map[t.cartao_id] = { id: t.cartao_id, nome: c?.nome ?? 'Cartão', cor: c?.cor ?? '#9ca3af', total: 0 }
      }
      map[t.cartao_id].total += Number(t.valor)
    })
  const lista = Object.values(map).sort((a, b) => b.total - a.total)
  const maior = lista[0]?.total ?? 1
  return lista.map(i => ({ ...i, pct: Math.round((i.total / maior) * 100) }))
})

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>
