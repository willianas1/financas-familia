import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

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
      .select('*, categorias(nome, cor, icone)')
      .eq('familia_id', auth.familiaId)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: false })
    if (error) console.error('transacoes.carregar:', error)
    transacoes.value = data ?? []
    loading.value = false
  }

  async function criar(payload) {
    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...payload, familia_id: auth.familiaId, membro_id: auth.user.id })
      .select('*, categorias(nome, cor, icone)')
      .single()
    if (error) throw error
    transacoes.value.unshift(data)
    return data
  }

  async function criarParcelamento(payload) {
    const { descricao, valor_total, num_parcelas, valor_parcela, data_inicio, tipo_calculo, categoria_id } = payload

    const { data: parc, error } = await supabase
      .from('parcelamentos')
      .insert({ descricao, valor_total, num_parcelas, valor_parcela, data_inicio, tipo_calculo, familia_id: auth.familiaId })
      .select()
      .single()
    if (error) throw error

    const parcelas = []
    const dataBase = new Date(data_inicio + 'T12:00:00')
    for (let i = 0; i < num_parcelas; i++) {
      const d = new Date(dataBase)
      d.setMonth(d.getMonth() + i)
      parcelas.push({
        familia_id:       auth.familiaId,
        membro_id:        auth.user.id,
        tipo:             'despesa',
        valor:            valor_parcela,
        data:             d.toISOString().split('T')[0],
        descricao:        `${descricao} (${i + 1}/${num_parcelas})`,
        categoria_id,
        parcelamento_id:  parc.id,
        num_parcela:      i + 1,
      })
    }

    const { error: errT } = await supabase.from('transacoes').insert(parcelas)
    if (errT) throw errT
    await carregar()
    return parc
  }

  async function criarRecorrente(payload) {
    const { tipo, valor, categoria_id, data_inicio, descricao, num_meses } = payload

    const registros = []
    const dataBase  = new Date(data_inicio + 'T12:00:00')
    for (let i = 0; i < num_meses; i++) {
      const d = new Date(dataBase)
      d.setMonth(d.getMonth() + i)
      registros.push({
        familia_id:   auth.familiaId,
        membro_id:    auth.user.id,
        tipo,
        valor,
        data:         d.toISOString().split('T')[0],
        descricao,
        categoria_id,
      })
    }

    const { error } = await supabase.from('transacoes').insert(registros)
    if (error) throw error
    await carregar()
  }

  async function remover(id) {
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    if (error) throw error
    transacoes.value = transacoes.value.filter(t => t.id !== id)
  }

  return {
    transacoes, loading, mesAtual, anoAtual,
    totalReceitas, totalDespesas, saldo,
    carregar, criar, criarParcelamento, criarRecorrente, remover,
  }
})
