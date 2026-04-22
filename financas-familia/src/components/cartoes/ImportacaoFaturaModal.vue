<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('fechar')">
    <div class="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]">

      <!-- Header fixo -->
      <div class="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 class="font-bold text-gray-900">Importar fatura</h2>
          <p class="text-xs text-gray-400 mt-0.5 capitalize">{{ cartao.nome }} · Fatura {{ faturaLabel }}</p>
        </div>
        <button @click="$emit('fechar')" class="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Step 1: Upload -->
      <div v-if="step === 'upload'" class="p-5 space-y-4 flex-1">
        <p class="text-sm text-gray-600">
          Faça upload de um arquivo CSV com as despesas da fatura. Despesas parceladas serão lançadas nas faturas seguintes automaticamente.
        </p>

        <button @click="baixarTemplate" class="flex items-center gap-2 text-sm text-primary-600 hover:underline">
          <DownloadIcon class="w-4 h-4" />
          Baixar modelo CSV
        </button>

        <label
          class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
        >
          <UploadIcon class="w-8 h-8 text-gray-300 mb-2" />
          <span class="text-sm text-gray-500">Clique para selecionar o arquivo CSV</span>
          <span class="text-xs text-gray-400 mt-1">Formato: descricao, valor_total, data, parcelas</span>
          <input type="file" accept=".csv,.txt" class="hidden" @change="processarCSV" />
        </label>

        <p v-if="erroUpload" class="text-sm text-danger">{{ erroUpload }}</p>
      </div>

      <!-- Step 2: Preview -->
      <template v-if="step === 'preview'">
        <!-- Barra de seleção -->
        <div class="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" :checked="todosSelecionados" @change="toggleTodos" class="w-4 h-4 rounded" />
            <span class="text-sm text-gray-600">{{ selecionados.length }} de {{ linhas.length }} selecionados</span>
          </label>
          <span v-if="erroImport" class="text-sm text-danger ml-auto">{{ erroImport }}</span>
        </div>

        <!-- Barra de aplicar em massa -->
        <div class="flex items-center gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <span class="text-xs text-gray-500 whitespace-nowrap">Aplicar a todos:</span>
          <select v-model="bulkCategoria" class="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-primary-400 bg-white">
            <option value="">Categoria...</option>
            <option v-for="c in cats.despesas" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
          <select v-if="ccStore.ativos.length" v-model="bulkCC" class="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-primary-400 bg-white">
            <option value="">Centro de custo...</option>
            <option v-for="c in ccStore.ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
          <button
            @click="aplicarATodos"
            :disabled="!bulkCategoria && !bulkCC"
            class="text-xs text-primary-600 font-medium hover:underline whitespace-nowrap disabled:opacity-40 disabled:no-underline"
          >
            Aplicar
          </button>
        </div>

        <div class="overflow-auto flex-1">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-3 py-2 w-8"></th>
                <th class="px-3 py-2 text-left">Descrição</th>
                <th class="px-3 py-2 text-right w-24">Valor</th>
                <th class="px-3 py-2 text-center w-20">Parcelas</th>
                <th class="px-3 py-2 text-left w-36">Categoria</th>
                <th v-if="ccStore.ativos.length" class="px-3 py-2 text-left w-36">Centro de custo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="(row, i) in linhas"
                :key="i"
                :class="['transition-colors', row.selecionado ? 'bg-white' : 'bg-gray-50 opacity-50']"
              >
                <td class="px-3 py-2">
                  <input type="checkbox" v-model="row.selecionado" class="w-4 h-4 rounded" />
                </td>
                <td class="px-3 py-2">
                  <input v-model="row.descricao" class="w-full text-sm border border-transparent hover:border-gray-200 focus:border-primary-400 rounded-lg px-1.5 py-1 outline-none" />
                </td>
                <td class="px-3 py-2 text-right font-medium text-danger whitespace-nowrap">
                  {{ formatarMoeda(row.valor_total) }}
                  <p v-if="row.parcelas > 1" class="text-[10px] text-gray-400 font-normal">
                    {{ formatarMoeda(row.valor_total / row.parcelas) }}/x
                  </p>
                </td>
                <td class="px-3 py-2 text-center">
                  <input
                    v-model.number="row.parcelas"
                    type="number" min="1" max="120"
                    class="w-14 text-center text-sm border border-transparent hover:border-gray-200 focus:border-primary-400 rounded-lg px-1 py-1 outline-none"
                  />
                </td>
                <td class="px-3 py-2">
                  <select v-model="row.categoria_id" class="w-full text-xs border border-gray-200 rounded-lg px-1.5 py-1 outline-none focus:border-primary-400 bg-white">
                    <option value="">Sem categoria</option>
                    <option v-for="c in cats.despesas" :key="c.id" :value="c.id">{{ c.nome }}</option>
                  </select>
                </td>
                <td v-if="ccStore.ativos.length" class="px-3 py-2">
                  <select v-model="row.centro_custo_id" class="w-full text-xs border border-gray-200 rounded-lg px-1.5 py-1 outline-none focus:border-primary-400 bg-white">
                    <option value="">Nenhum</option>
                    <option v-for="c in ccStore.ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
          <button @click="step = 'upload'" class="btn-secondary flex-shrink-0">Voltar</button>
          <button
            @click="importar"
            :disabled="!selecionados.length || importando"
            class="btn-primary flex-1"
          >
            {{ importando ? 'Importando...' : `Importar ${selecionados.length} despesa(s)` }}
          </button>
        </div>
      </template>

      <!-- Step 3: Sucesso -->
      <div v-if="step === 'sucesso'" class="p-8 text-center flex-1 flex flex-col items-center justify-center gap-3">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircleIcon class="w-8 h-8 text-success" />
        </div>
        <p class="font-semibold text-gray-900">{{ totalImportado }} despesa(s) importadas!</p>
        <p class="text-sm text-gray-500">As despesas parceladas foram distribuídas nas faturas seguintes.</p>
        <button @click="$emit('importado')" class="btn-primary px-8 mt-2">Fechar</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { XIcon, DownloadIcon, UploadIcon, CheckCircleIcon } from 'lucide-vue-next'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'
import { useCentrosCustoStore } from '@/stores/centrosCusto'

const props = defineProps({
  cartao:       { type: Object, required: true },
  mesFatura:    { type: String, required: true }, // 'YYYY-MM-01'
})
const emit = defineEmits(['fechar', 'importado'])

const transacoes = useTransacoesStore()
const cats       = useCategoriasStore()
const ccStore    = useCentrosCustoStore()

onMounted(async () => {
  await Promise.all([
    cats.categorias.length ? null : cats.carregar(),
    ccStore.centros?.length ? null : ccStore.carregar(),
  ])
})

const step          = ref('upload')
const linhas        = ref([])
const erroUpload    = ref('')
const erroImport    = ref('')
const importando    = ref(false)
const totalImportado = ref(0)

const bulkCategoria = ref('')
const bulkCC        = ref('')

function aplicarATodos() {
  linhas.value.forEach(r => {
    if (bulkCategoria.value) r.categoria_id = bulkCategoria.value
    if (bulkCC.value) r.centro_custo_id = bulkCC.value
  })
}

const faturaLabel = computed(() =>
  new Date(props.mesFatura + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

const selecionados = computed(() => linhas.value.filter(r => r.selecionado))
const todosSelecionados = computed(() => linhas.value.length > 0 && selecionados.value.length === linhas.value.length)

function toggleTodos(e) {
  linhas.value.forEach(r => (r.selecionado = e.target.checked))
}

function parseCSV(text) {
  // Remove BOM (UTF-8 ou Latin-1)
  text = text.replace(/^﻿/, '').replace(/^ï»¿/, '')

  const linhasTexto = text.split(/\r?\n/).filter(l => l.trim())
  if (linhasTexto.length < 2) throw new Error('Arquivo deve ter cabeçalho e ao menos uma linha de dados.')

  // Detecta separador (vírgula ou ponto-e-vírgula)
  const sep = linhasTexto[0].includes(';') ? ';' : ','

  const parseRow = (line) => {
    const cols = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === sep && !inQuote) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    return cols
  }

  const header   = parseRow(linhasTexto[0]).map(h => h.toLowerCase().replace(/[\s"]/g, ''))
  const faturaAno = props.mesFatura.split('-')[0]

  return linhasTexto.slice(1).map((linha) => {
    if (!linha.trim()) return null
    const cols = parseRow(linha)
    const get  = (nomes) => {
      for (const n of nomes) {
        const i = header.indexOf(n)
        if (i !== -1) return (cols[i] ?? '').trim()
      }
      return ''
    }

    const descricao   = get(['descricao', 'description', 'nome'])
    const dataStr     = get(['data', 'date'])
    const parcelasStr = get(['parcelas', 'installments', 'qtd_parcelas'])
    const numParcelas = Math.max(1, parseInt(parcelasStr) || 1)

    // Suporta valor_total (total da compra) ou valor_parcela (valor já dividido)
    const totalRaw   = get(['valor_total', 'valor', 'value', 'amount']).replace(',', '.')
    const parcelaRaw = get(['valor_parcela', 'vlr_parcela', 'valor_x']).replace(',', '.')
    let valor_total
    if (parcelaRaw) {
      valor_total = Math.round(parseFloat(parcelaRaw) * numParcelas * 100) / 100
    } else {
      valor_total = parseFloat(totalRaw)
    }

    if (!descricao || isNaN(valor_total) || valor_total <= 0) return null

    // Normaliza data para YYYY-MM-DD
    // Aceita: YYYY-MM-DD | DD/MM/AAAA | DD/MM/AA | DD/MM (sem ano → usa ano da fatura)
    let data = dataStr
    if (data && data.includes('/')) {
      const parts = data.split('/')
      if (parts.length === 3) {
        data = parts[2].length === 4
          ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          : `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      } else if (parts.length === 2) {
        data = `${faturaAno}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) data = props.mesFatura

    return {
      selecionado:     true,
      descricao,
      valor_total,
      data,
      parcelas:        numParcelas,
      categoria_id:    '',
      centro_custo_id: '',
    }
  }).filter(Boolean)
}

function processarCSV(event) {
  erroUpload.value = ''
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const rows = parseCSV(e.target.result)
      if (!rows.length) throw new Error('Nenhuma linha válida encontrada no arquivo.')
      linhas.value = rows
      step.value   = 'preview'
    } catch (err) {
      erroUpload.value = err.message
    }
  }
  reader.readAsText(file, 'UTF-8')
}

async function importar() {
  erroImport.value = ''

  const semCategoria = selecionados.value.filter(r => !r.categoria_id)
  if (semCategoria.length) {
    erroImport.value = `${semCategoria.length} despesa(s) sem categoria. Selecione uma categoria para todas.`
    return
  }

  if (ccStore.ativos.length) {
    const semCC = selecionados.value.filter(r => !r.centro_custo_id)
    if (semCC.length) {
      erroImport.value = `${semCC.length} despesa(s) sem centro de custo. Selecione um centro para todas.`
      return
    }
  }

  importando.value = true
  try {
    await transacoes.importarLancamentos(
      selecionados.value,
      props.cartao.id,
      props.cartao,
      props.mesFatura,
    )
    totalImportado.value = selecionados.value.reduce((s, r) => s + Math.max(1, r.parcelas), 0)
    step.value = 'sucesso'
  } catch (e) {
    erroImport.value = 'Erro ao importar. Verifique os dados e tente novamente.'
  } finally {
    importando.value = false
  }
}

function baixarTemplate() {
  const hoje = new Date().toISOString().split('T')[0]
  const csv = [
    'descricao,valor_total,data,parcelas',
    `Netflix,55.90,${hoje},1`,
    `Smartphone,1800.00,${hoje},6`,
    `Supermercado,320.00,${hoje},1`,
  ].join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'modelo_importacao_fatura.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>
