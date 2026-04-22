<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('fechar')">
    <div class="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[95vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 class="font-bold text-gray-900">{{ editando ? 'Editar' : 'Novo' }} lançamento</h2>
        <button @click="$emit('fechar')" class="p-1 rounded-lg hover:bg-gray-100">
          <XIcon class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form @submit.prevent="salvar" class="p-5 space-y-4 overflow-y-auto">
        <!-- Tipo (Receita / Despesa) -->
        <div class="flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            v-for="t in tipos"
            :key="t.value"
            @click="form.tipo = t.value; form.parcelado = false; form.recorrente = false"
            :class="['flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                     form.tipo === t.value
                       ? (t.value === 'receita' ? 'bg-white text-success shadow-sm' : 'bg-white text-danger shadow-sm')
                       : 'text-gray-500']"
          >
            <component :is="t.icon" class="w-4 h-4" />
            {{ t.label }}
          </button>
        </div>

        <!-- Toggle parcelamento (só despesa) -->
        <div v-if="form.tipo === 'despesa'" class="flex items-center justify-between">
          <span class="text-sm text-gray-700">Compra parcelada?</span>
          <button
            type="button"
            @click="form.parcelado = !form.parcelado; form.recorrente = false"
            :class="['relative w-10 h-6 rounded-full transition-colors', form.parcelado ? 'bg-primary-600' : 'bg-gray-200']"
          >
            <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', form.parcelado ? 'left-5' : 'left-1']"></span>
          </button>
        </div>

        <!-- Toggle recorrente -->
        <div v-if="!form.parcelado" class="flex items-center justify-between">
          <div>
            <span class="text-sm text-gray-700">Repetir mensalmente?</span>
            <p class="text-xs text-gray-400">Ex: salário, aluguel, assinatura</p>
          </div>
          <button
            type="button"
            @click="form.recorrente = !form.recorrente"
            :class="['relative w-10 h-6 rounded-full transition-colors', form.recorrente ? 'bg-primary-600' : 'bg-gray-200']"
          >
            <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', form.recorrente ? 'left-5' : 'left-1']"></span>
          </button>
        </div>

        <!-- Campos de recorrência -->
        <div v-if="form.recorrente && !form.parcelado" class="bg-green-50 rounded-xl p-4 space-y-2">
          <div>
            <label class="label text-xs">Repetir por quantos meses?</label>
            <input v-model.number="form.numMeses" type="number" min="2" max="60" class="input" placeholder="12" required />
          </div>
          <p class="text-xs text-green-700 font-medium">
            Serão criados {{ form.numMeses }} lançamentos, de
            {{ formatarMesAno(form.data) }} até {{ formatarMesAno(form.data, form.numMeses - 1) }}
          </p>
        </div>

        <!-- Valor -->
        <div>
          <label class="label">Valor (R$)</label>
          <input
            v-model="form.valor"
            type="number"
            step="0.01"
            min="0.01"
            inputmode="decimal"
            class="input text-lg font-semibold"
            placeholder="0,00"
            required
          />
        </div>

        <!-- Parcelamento fields -->
        <template v-if="form.parcelado && form.tipo === 'despesa'">
          <div class="bg-primary-50 rounded-xl p-4 space-y-3">
            <div class="flex gap-2 bg-white rounded-lg p-1">
              <button
                type="button"
                v-for="m in modosParcela"
                :key="m.value"
                @click="form.tipoParcela = m.value"
                :class="['flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                         form.tipoParcela === m.value ? 'bg-primary-600 text-white' : 'text-gray-500']"
              >
                {{ m.label }}
              </button>
            </div>
            <div>
              <label class="label text-xs">Número de parcelas</label>
              <input v-model.number="form.numParcelas" type="number" min="2" max="120" class="input" placeholder="12" required />
            </div>
            <p v-if="form.tipoParcela === 'total' && form.valor && form.numParcelas" class="text-xs text-primary-700 font-medium">
              {{ form.numParcelas }}x de {{ formatarMoeda(form.valor / form.numParcelas) }}
            </p>
            <div v-if="form.tipoParcela === 'parcela_manual'">
              <label class="label text-xs">Valor de cada parcela (R$)</label>
              <input v-model="form.valorParcela" type="number" step="0.01" min="0.01" inputmode="decimal" class="input" placeholder="0,00" required />
            </div>
          </div>
        </template>

        <!-- Cartão de crédito (só despesa) -->
        <div v-if="form.tipo === 'despesa'">
          <label class="label">Cartão de crédito <span class="text-gray-400 font-normal">(opcional)</span></label>
          <select v-model="form.cartao_id" class="input">
            <option value="">À vista / sem cartão</option>
            <option v-for="c in cartoes.ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>

        <!-- Seletor de fatura (quando cartão selecionado) -->
        <div v-if="form.tipo === 'despesa' && form.cartao_id">
          <label class="label">Fatura</label>
          <select v-model="form.mes_fatura" class="input">
            <option v-for="opt in opcoesFatura" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p v-if="vencimentoFaturaLabel" class="text-xs text-primary-600 mt-1 flex items-center gap-1">
            <CreditCardIcon class="w-3 h-3" />
            Vence {{ vencimentoFaturaLabel }}
          </p>
        </div>

        <!-- Categoria -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="label mb-0">Categoria</label>
            <button
              type="button"
              @click="novaCategoria = !novaCategoria; novaCatNome = ''; novaCatCor = gerarCorAleatoria(cats.categorias.map(c => c.cor))"
              class="text-xs text-primary-600 hover:underline flex items-center gap-1"
            >
              <PlusIcon class="w-3 h-3" />
              {{ novaCategoria ? 'Cancelar' : 'Nova categoria' }}
            </button>
          </div>

          <!-- Mini-form nova categoria -->
          <div v-if="novaCategoria" class="bg-primary-50 rounded-xl p-3 mb-2 space-y-2">
            <input
              v-model="novaCatNome"
              class="input text-sm"
              placeholder="Nome da categoria"
              maxlength="40"
              autofocus
            />
            <div class="flex items-center gap-2">
              <input v-model="novaCatCor" type="color" class="h-8 w-10 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" />
              <button
                type="button"
                @click="novaCatCor = gerarCorAleatoria(cats.categorias.map(c => c.cor))"
                class="h-8 px-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors flex-shrink-0"
                title="Gerar cor aleatória"
              >🎲</button>
              <button
                type="button"
                @click="criarCategoriaInline"
                :disabled="!novaCatNome.trim() || criandoCat"
                class="btn-primary flex-1 py-2 text-sm"
              >
                {{ criandoCat ? 'Criando...' : 'Criar e selecionar' }}
              </button>
            </div>
          </div>

          <select v-model="form.categoria_id" class="input" required>
            <option value="" disabled>Selecione...</option>
            <option v-for="c in categoriasVisiveis" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>

        <!-- Data -->
        <div>
          <label class="label">{{ form.recorrente ? 'Mês inicial' : 'Data' }}</label>
          <input v-model="form.data" type="date" class="input" required />
        </div>

        <!-- Data de vencimento manual (só despesa sem cartão, não parcelada e não recorrente) -->
        <div v-if="form.tipo === 'despesa' && !form.cartao_id && !form.parcelado && !form.recorrente">
          <label class="label">
            Data de vencimento
            <span class="text-gray-400 font-normal">(para controle de pagamento)</span>
          </label>
          <input v-model="form.data_vencimento" type="date" class="input" required />
        </div>

        <!-- Toggle "Já está paga?" (só despesa avulsa) -->
        <div v-if="form.tipo === 'despesa' && !form.parcelado && !form.recorrente" class="flex items-center justify-between">
          <div>
            <span class="text-sm text-gray-700">Já está paga?</span>
            <p class="text-xs text-gray-400">Se não, ficará como pendente</p>
          </div>
          <button
            type="button"
            @click="form.ja_pago = !form.ja_pago"
            :class="['relative w-10 h-6 rounded-full transition-colors', form.ja_pago ? 'bg-success' : 'bg-gray-200']"
          >
            <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', form.ja_pago ? 'left-5' : 'left-1']"></span>
          </button>
        </div>

        <!-- Centro de custo -->
        <div v-if="ccStore.ativos.length">
          <label class="label">Centro de custo</label>
          <select v-model="form.centro_custo_id" class="input" required>
            <option value="" disabled>Selecione...</option>
            <option v-for="c in ccStore.ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>

        <!-- Descrição -->
        <div>
          <label class="label">Descrição <span class="text-gray-400 font-normal">(opcional)</span></label>
          <input v-model="form.descricao" type="text" class="input" placeholder="Ex: Salário, Conta de luz..." maxlength="120" />
        </div>

        <p v-if="erro" class="text-danger text-sm">{{ erro }}</p>

        <button type="submit" :disabled="salvando" class="btn-primary w-full py-3">
          {{ salvando ? 'Salvando...' : labelBotao }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { XIcon, TrendingUpIcon, TrendingDownIcon, PlusIcon, CreditCardIcon } from 'lucide-vue-next'
import { useTransacoesStore } from '@/stores/transacoes'
import { useCategoriasStore } from '@/stores/categorias'
import { useCartoesStore, calcularMesFatura, calcularVencimentoFatura } from '@/stores/cartoes'
import { useCentrosCustoStore } from '@/stores/centrosCusto'
import { gerarCorAleatoria } from '@/utils/cores'

const props = defineProps({ inicial: { type: Object, default: null } })
const emit  = defineEmits(['fechar', 'salvo'])

const transacoes = useTransacoesStore()
const cats       = useCategoriasStore()
const cartoes    = useCartoesStore()
const ccStore    = useCentrosCustoStore()

const editando = computed(() => !!props.inicial?.id)
const hoje     = new Date().toISOString().split('T')[0]

const form = ref({
  tipo:            props.inicial?.tipo         ?? 'despesa',
  valor:           props.inicial?.valor        ?? '',
  categoria_id:    props.inicial?.categoria_id ?? '',
  cartao_id:       props.inicial?.cartao_id    ?? '',
  mes_fatura:      props.inicial?.mes_fatura    ?? null,
  centro_custo_id: props.inicial?.centro_custo_id ?? '',
  data:            props.inicial?.data         ?? hoje,
  data_vencimento: props.inicial?.data_vencimento ?? hoje,
  ja_pago:         props.inicial?.status_pagamento === 'pago' || props.inicial?.tipo === 'receita',
  descricao:       props.inicial?.descricao    ?? '',
  parcelado:       false,
  tipoParcela:     'total',
  numParcelas:     2,
  valorParcela:    '',
  recorrente:      false,
  numMeses:        12,
})

// Cartão selecionado (objeto completo)
const cartaoSelecionado = computed(() =>
  form.value.cartao_id ? cartoes.cartoes.find(c => c.id === form.value.cartao_id) : null
)

// Mês sugerido pelo sistema com base na data e no dia de fechamento
const mesFaturaSugerido = computed(() => {
  const cartao = cartaoSelecionado.value
  if (!cartao || !form.value.data) return null
  return calcularMesFatura(form.value.data, cartao)
})

// Opções de fatura: 3 meses antes do sugerido até 4 meses depois
const opcoesFatura = computed(() => {
  const base = mesFaturaSugerido.value
  if (!base) return []
  const opts = []
  for (let i = -3; i <= 4; i++) {
    const d = new Date(base + 'T12:00:00')
    d.setMonth(d.getMonth() + i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const lbl = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const label = (i === 0 ? '★ ' : '') + lbl.charAt(0).toUpperCase() + lbl.slice(1)
    opts.push({ value: val, label })
  }
  return opts
})

// Data de vencimento da fatura selecionada
const vencimentoFaturaLabel = computed(() => {
  const cartao = cartaoSelecionado.value
  if (!cartao || !form.value.mes_fatura) return null
  const vencISO = calcularVencimentoFatura(form.value.mes_fatura, cartao)
  if (!vencISO) return null
  return new Date(vencISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
})

const tipos = [
  { value: 'despesa', label: 'Despesa', icon: TrendingDownIcon },
  { value: 'receita', label: 'Receita', icon: TrendingUpIcon },
]
const modosParcela = [
  { value: 'total',          label: 'Valor total ÷ parcelas' },
  { value: 'parcela_manual', label: 'Valor da parcela' },
]

const categoriasVisiveis = computed(() =>
  form.value.tipo === 'receita' ? cats.receitas : cats.despesas
)

const labelBotao = computed(() => {
  if (salvando.value) return 'Salvando...'
  if (form.value.recorrente) return `Criar ${form.value.numMeses} lançamentos`
  if (form.value.parcelado)  return `Criar ${form.value.numParcelas} parcelas`
  return 'Salvar'
})

watch(() => form.value.tipo, () => {
  form.value.categoria_id = ''
  form.value.cartao_id    = ''
  form.value.mes_fatura   = null
  novaCategoria.value     = false
})

// Ao trocar cartão: reinicia mes_fatura para o sugerido
watch(() => form.value.cartao_id, () => {
  form.value.mes_fatura = mesFaturaSugerido.value
})

// Ao mudar a data: atualiza mes_fatura sugerido (só se ainda é igual ao anterior sugerido,
// i.e., o usuário não escolheu manualmente)
watch(mesFaturaSugerido, (novoSugerido, antigoSugerido) => {
  if (!novoSugerido) return
  if (!form.value.mes_fatura || form.value.mes_fatura === antigoSugerido) {
    form.value.mes_fatura = novoSugerido
  }
})

watch(() => form.value.data, (val) => {
  if (!form.value.data_vencimento || form.value.data_vencimento < val) {
    form.value.data_vencimento = val
  }
})

onMounted(() => {
  if (!cartoes.cartoes.length) cartoes.carregar()
  if (!ccStore.centros.length) ccStore.carregar()
})

const salvando      = ref(false)
const erro          = ref('')
const novaCategoria = ref(false)
const novaCatNome   = ref('')
const novaCatCor    = ref('#6366f1')
const criandoCat    = ref(false)

async function criarCategoriaInline() {
  if (!novaCatNome.value.trim()) return
  criandoCat.value = true
  try {
    const nova = await cats.criar({
      nome: novaCatNome.value.trim(),
      tipo: form.value.tipo,
      cor:  novaCatCor.value,
    })
    form.value.categoria_id = nova.id
    novaCategoria.value = false
  } finally {
    criandoCat.value = false
  }
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatarMesAno(dataStr, somarMeses = 0) {
  if (!dataStr) return ''
  const d = new Date(dataStr + 'T12:00:00')
  d.setMonth(d.getMonth() + somarMeses)
  return `${MESES[d.getMonth()]}/${d.getFullYear()}`
}

function formatarMoeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function salvar() {
  erro.value = ''
  if (ccStore.ativos.length && !form.value.centro_custo_id) {
    erro.value = 'Selecione um centro de custo.'
    return
  }
  salvando.value = true
  try {
    const cartaoId = form.value.tipo === 'despesa' && form.value.cartao_id ? form.value.cartao_id : null
    const cartao   = cartaoId ? cartaoSelecionado.value : null

    const ccId = form.value.centro_custo_id || null

    if (form.value.recorrente) {
      await transacoes.criarRecorrente({
        tipo:            form.value.tipo,
        valor:           Number(form.value.valor),
        categoria_id:    form.value.categoria_id,
        cartao_id:       cartaoId,
        centro_custo_id: ccId,
        data_inicio:     form.value.data,
        descricao:       form.value.descricao || null,
        num_meses:       form.value.numMeses,
      }, cartao)
    } else if (form.value.parcelado && form.value.tipo === 'despesa') {
      const valorParcela = form.value.tipoParcela === 'total'
        ? form.value.valor / form.value.numParcelas
        : Number(form.value.valorParcela)

      await transacoes.criarParcelamento({
        descricao:       form.value.descricao || 'Compra parcelada',
        valor_total:     form.value.tipoParcela === 'total' ? Number(form.value.valor) : valorParcela * form.value.numParcelas,
        num_parcelas:    form.value.numParcelas,
        valor_parcela:   valorParcela,
        data_inicio:     form.value.data,
        tipo_calculo:    form.value.tipoParcela,
        categoria_id:    form.value.categoria_id,
        cartao_id:       cartaoId,
        centro_custo_id: ccId,
      }, cartao)
    } else {
      const hojeStr         = new Date().toISOString().split('T')[0]
      const statusPagamento = form.value.tipo === 'receita' || form.value.ja_pago ? 'pago' : 'pendente'

      // Para despesas com cartão: usa mes_fatura do select; data_vencimento calculada a partir dele
      let mes_fatura      = cartaoId ? (form.value.mes_fatura || calcularMesFatura(form.value.data, cartao)) : null
      let data_vencimento = form.value.tipo === 'despesa' ? form.value.data_vencimento : null

      if (cartao) {
        data_vencimento = calcularVencimentoFatura(mes_fatura, cartao)
      }

      await transacoes.criar({
        tipo:             form.value.tipo,
        valor:            Number(form.value.valor),
        categoria_id:     form.value.categoria_id,
        cartao_id:        cartaoId,
        centro_custo_id:  ccId,
        mes_fatura,
        data:             form.value.data,
        descricao:        form.value.descricao || null,
        data_vencimento,
        status_pagamento: statusPagamento,
        data_pagamento:   statusPagamento === 'pago' ? hojeStr : null,
      })
    }
    emit('salvo')
    emit('fechar')
  } catch (e) {
    erro.value = 'Erro ao salvar. Tente novamente.'
  } finally {
    salvando.value = false
  }
}
</script>
