import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { calcularMesFatura, avancarMesFatura, calcularVencimentoFatura } from './cartoes'

const SELECT_FIELDS = '*, categorias(nome, cor, icone), cartoes_credito(nome, cor, bandeira), centros_custo(nome, cor)'

export const useTransacoesStore = defineStore('transacoes', () => {
  const auth       = useAuthStore()
  const transacoes = ref([])
  const loading    = ref(false)
  const mesAtual   = ref(new Date().getMonth() + 1)
  const anoAtual   = ref(new Date().getFullYear())

  const totalReceitas = computed(() =>
    transacoes.value.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  )
  const totalDespesas = computed(() =>
    transacoes.value.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
  )
  const saldo = computed(() => totalReceitas.value - totalDespesas.value)

  async function carregar(mes = mesAtual.value, ano = anoAtual.value) {
    if (!auth.familiaId) return
    loading.value = true
    mesAtual.value = mes
    anoAtual.value = ano

    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim    = new Date(ano, mes, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transacoes')
      .select(SELECT_FIELDS)
      .eq('familia_id', auth.familiaId)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: false })
    if (error) console.error('transacoes.carregar:', error)
    transacoes.value = data ?? []
    loading.value = false
  }

  async function carregarPorCampoData(campo, mes, ano) {
    if (!auth.familiaId) return []
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim    = new Date(ano, mes, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('transacoes')
      .select(SELECT_FIELDS)
      .eq('familia_id', auth.familiaId)
      .gte(campo, inicio)
      .lte(campo, fim)
      .order(campo, { ascending: false })
    if (error) console.error('transacoes.carregarPorCampoData:', error)
    return data ?? []
  }

  async function carregarPendentes() {
    if (!auth.familiaId) return []
    const { data, error } = await supabase
      .from('transacoes')
      .select(SELECT_FIELDS)
      .eq('familia_id', auth.familiaId)
      .eq('tipo', 'despesa')
      .eq('status_pagamento', 'pendente')
      .not('data_vencimento', 'is', null)
      .order('data_vencimento', { ascending: true })
    if (error) console.error('transacoes.carregarPendentes:', error)
    return data ?? []
  }

  async function carregarPagas(diasAtras = 30) {
    if (!auth.familiaId) return []
    const limite = new Date()
    limite.setDate(limite.getDate() - diasAtras)
    const { data, error } = await supabase
      .from('transacoes')
      .select(SELECT_FIELDS)
      .eq('familia_id', auth.familiaId)
      .eq('tipo', 'despesa')
      .eq('status_pagamento', 'pago')
      .not('data_vencimento', 'is', null)
      .gte('data_pagamento', limite.toISOString().split('T')[0])
      .order('data_pagamento', { ascending: false })
    if (error) console.error('transacoes.carregarPagas:', error)
    return data ?? []
  }

  async function criar(payload) {
    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...payload, familia_id: auth.familiaId, membro_id: auth.user.id })
      .select(SELECT_FIELDS)
      .single()
    if (error) throw error
    transacoes.value.unshift(data)
    return data
  }

  async function criarParcelamento(payload, cartao = null) {
    const { descricao, valor_total, num_parcelas, valor_parcela, data_inicio, tipo_calculo, categoria_id, cartao_id, centro_custo_id } = payload

    const { data: parc, error } = await supabase
      .from('parcelamentos')
      .insert({ descricao, valor_total, num_parcelas, valor_parcela, data_inicio, tipo_calculo, familia_id: auth.familiaId })
      .select()
      .single()
    if (error) throw error

    // Calcula mes_fatura da 1ª parcela; as demais avançam 1 mês por parcela
    const mesFaturaBase = cartao_id && cartao
      ? calcularMesFatura(data_inicio, cartao)
      : null

    const parcelas = []
    const dataBase = new Date(data_inicio + 'T12:00:00')
    for (let i = 0; i < num_parcelas; i++) {
      const d = new Date(dataBase)
      d.setMonth(d.getMonth() + i)
      const dataStr = d.toISOString().split('T')[0]

      const mesFatura = mesFaturaBase ? avancarMesFatura(mesFaturaBase, i) : null
      const dataVenc  = mesFatura
        ? calcularVencimentoFatura(mesFatura, cartao)
        : dataStr

      parcelas.push({
        familia_id:        auth.familiaId,
        membro_id:         auth.user.id,
        tipo:              'despesa',
        valor:             valor_parcela,
        data:              dataStr,
        descricao:         `${descricao} (${i + 1}/${num_parcelas})`,
        categoria_id,
        cartao_id:         cartao_id ?? null,
        centro_custo_id:   centro_custo_id ?? null,
        parcelamento_id:   parc.id,
        num_parcela:       i + 1,
        mes_fatura:        mesFatura,
        data_vencimento:   dataVenc,
        status_pagamento:  'pendente',
      })
    }

    const { error: errT } = await supabase.from('transacoes').insert(parcelas)
    if (errT) throw errT
    await carregar()
    return parc
  }

  async function criarRecorrente(payload, cartao = null) {
    const { tipo, valor, categoria_id, cartao_id, centro_custo_id, data_inicio, descricao, num_meses } = payload

    const registros = []
    const dataBase  = new Date(data_inicio + 'T12:00:00')
    for (let i = 0; i < num_meses; i++) {
      const d = new Date(dataBase)
      d.setMonth(d.getMonth() + i)
      const dataStr = d.toISOString().split('T')[0]

      const mesFatura = cartao_id && cartao && tipo === 'despesa'
        ? calcularMesFatura(dataStr, cartao)
        : null
      const dataVenc = mesFatura
        ? calcularVencimentoFatura(mesFatura, cartao)
        : (tipo === 'despesa' ? dataStr : null)

      registros.push({
        familia_id:        auth.familiaId,
        membro_id:         auth.user.id,
        tipo,
        valor,
        data:              dataStr,
        descricao,
        categoria_id,
        cartao_id:         cartao_id ?? null,
        centro_custo_id:   centro_custo_id ?? null,
        mes_fatura:        mesFatura,
        data_vencimento:   dataVenc,
        status_pagamento:  tipo === 'despesa' ? 'pendente' : 'pago',
      })
    }

    const { error } = await supabase.from('transacoes').insert(registros)
    if (error) throw error
    await carregar()
  }

  async function atualizarMesFatura(id, mesFatura, cartao) {
    const dataVenc = calcularVencimentoFatura(mesFatura, cartao)
    const { error } = await supabase
      .from('transacoes')
      .update({ mes_fatura: mesFatura, data_vencimento: dataVenc })
      .eq('id', id)
    if (error) throw error
    const t = transacoes.value.find(t => t.id === id)
    if (t) { t.mes_fatura = mesFatura; t.data_vencimento = dataVenc }
  }

  async function marcarPago(id, dataPagamento) {
    const data = dataPagamento ?? new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('transacoes')
      .update({ status_pagamento: 'pago', data_pagamento: data })
      .eq('id', id)
    if (error) throw error
    const t = transacoes.value.find(t => t.id === id)
    if (t) { t.status_pagamento = 'pago'; t.data_pagamento = data }
  }

  async function pagarFaturaCartao(cartaoId, mesFatura, dataPagamento) {
    const data = dataPagamento ?? new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('transacoes')
      .update({ status_pagamento: 'pago', data_pagamento: data })
      .eq('cartao_id', cartaoId)
      .eq('mes_fatura', mesFatura)
      .eq('status_pagamento', 'pendente')
    if (error) throw error
  }

  // Importação de fatura via CSV
  // items: [{ descricao, valor_total, data, parcelas, categoria_id, centro_custo_id }]
  // mesFaturaBase: 'YYYY-MM-01' da fatura selecionada em tela
  async function importarLancamentos(items, cartaoId, cartao, mesFaturaBase) {
    const registros = []
    for (const item of items) {
      const numParcelas = Math.max(1, parseInt(item.parcelas) || 1)
      const valorTotal  = Number(item.valor_total)
      const valorParc   = Math.round((valorTotal / numParcelas) * 100) / 100
      const dataCompra  = item.data || mesFaturaBase

      for (let i = 0; i < numParcelas; i++) {
        const mesFatura = avancarMesFatura(mesFaturaBase, i)
        registros.push({
          familia_id:       auth.familiaId,
          membro_id:        auth.user.id,
          tipo:             'despesa',
          valor:            valorParc,
          data:             dataCompra,
          descricao:        numParcelas > 1 ? `${item.descricao} (${i + 1}/${numParcelas})` : item.descricao,
          categoria_id:     item.categoria_id || null,
          cartao_id:        cartaoId,
          centro_custo_id:  item.centro_custo_id || null,
          mes_fatura:       mesFatura,
          data_vencimento:  calcularVencimentoFatura(mesFatura, cartao),
          status_pagamento: 'pendente',
        })
      }
    }
    const { error } = await supabase.from('transacoes').insert(registros)
    if (error) throw error
  }

  async function atualizarCampo(id, campos, centrosCustoStore = null) {
    const { data, error } = await supabase
      .from('transacoes')
      .update(campos)
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single()
    if (error) throw error
    const idx = transacoes.value.findIndex(t => t.id === id)
    if (idx !== -1) transacoes.value[idx] = data
    return data
  }

  async function remover(id) {
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    if (error) throw error
    transacoes.value = transacoes.value.filter(t => t.id !== id)
  }

  return {
    transacoes, loading, mesAtual, anoAtual,
    totalReceitas, totalDespesas, saldo,
    carregar, carregarPorCampoData, carregarPendentes, carregarPagas,
    criar, criarParcelamento, criarRecorrente,
    atualizarMesFatura, atualizarCampo, importarLancamentos, marcarPago, pagarFaturaCartao, remover,
  }
})
