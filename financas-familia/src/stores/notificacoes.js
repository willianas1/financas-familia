import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useNotificacoesStore = defineStore('notificacoes', () => {
  const auth         = useAuthStore()
  const notificacoes = ref([])

  const naoLidas = computed(() => notificacoes.value.filter(n => !n.lida))
  const contagem = computed(() => naoLidas.value.length)

  async function carregar() {
    if (!auth.familiaId) return
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('familia_id', auth.familiaId)
      .order('created_at', { ascending: false })
      .limit(50)
    notificacoes.value = data ?? []
  }

  async function marcarLida(id) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    const n = notificacoes.value.find(n => n.id === id)
    if (n) n.lida = true
  }

  async function marcarTodasLidas() {
    if (!auth.familiaId) return
    await supabase.from('notificacoes').update({ lida: true }).eq('familia_id', auth.familiaId).eq('lida', false)
    notificacoes.value.forEach(n => (n.lida = true))
  }

  async function gerarAlertas({ orcamentos, transacoesMes }) {
    if (!auth.familiaId) return

    const todosOsTipos = ['orcamento_80', 'orcamento_100', 'vencimento_atrasado', 'vencimento_hoje', 'vencimento_amanha']

    // Busca todas as notificações existentes desses tipos (lidas e não-lidas)
    const { data: existentes } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('familia_id', auth.familiaId)
      .in('tipo', todosOsTipos)

    const existentesArr = existentes ?? []

    // Monta os alertas que devem existir dado o estado atual
    const alertasDevidos = []

    // Orçamento
    for (const orc of orcamentos) {
      const gasto = transacoesMes
        .filter(t => t.tipo === 'despesa' && t.categoria_id === orc.categoria_id)
        .reduce((s, t) => s + Number(t.valor), 0)
      const pct = gasto / orc.valor_limite

      if (pct >= 1) {
        alertasDevidos.push({ tipo: 'orcamento_100', mensagem: `Orçamento de "${orc.categorias?.nome}" atingido (100%)!` })
      } else if (pct >= 0.8) {
        alertasDevidos.push({ tipo: 'orcamento_80', mensagem: `Orçamento de "${orc.categorias?.nome}" em 80%.` })
      }
    }

    // Vencimentos
    const hojeStr = new Date().toISOString().split('T')[0]
    const amanha  = new Date(); amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]

    const { data: pendentes } = await supabase
      .from('transacoes')
      .select('id, descricao, data_vencimento, categorias(nome)')
      .eq('familia_id', auth.familiaId)
      .eq('tipo', 'despesa')
      .eq('status_pagamento', 'pendente')
      .not('data_vencimento', 'is', null)
      .lte('data_vencimento', amanhaStr)

    for (const t of (pendentes ?? [])) {
      const venc = t.data_vencimento
      const nome = t.descricao || t.categorias?.nome || 'Despesa'

      if (venc < hojeStr) {
        alertasDevidos.push({ tipo: 'vencimento_atrasado', mensagem: `"${nome}" está atrasada.` })
      } else if (venc === hojeStr) {
        alertasDevidos.push({ tipo: 'vencimento_hoje', mensagem: `"${nome}" vence hoje!` })
      } else {
        alertasDevidos.push({ tipo: 'vencimento_amanha', mensagem: `"${nome}" vence amanhã.` })
      }
    }

    // Chave única por alerta: tipo + mensagem
    const chave = (a) => `${a.tipo}||${a.mensagem}`
    const chavesDevidas = new Set(alertasDevidos.map(chave))
    const chavesExistentes = new Set(existentesArr.map(chave))

    // Exclui apenas não-lidas cuja condição não vale mais
    const idsParaExcluir = existentesArr
      .filter(e => !e.lida && !chavesDevidas.has(chave(e)))
      .map(e => e.id)

    if (idsParaExcluir.length) {
      await supabase.from('notificacoes').delete().in('id', idsParaExcluir)
    }

    // Cria apenas alertas que ainda não existem (nem lidos nem não-lidos)
    const paraInserir = alertasDevidos.filter(a => !chavesExistentes.has(chave(a)))

    let novas = []
    if (paraInserir.length) {
      const { data } = await supabase
        .from('notificacoes')
        .insert(paraInserir.map(a => ({ ...a, familia_id: auth.familiaId, lida: false })))
        .select()
      novas = data ?? []
    }

    // Atualiza estado local: remove excluídas, adiciona novas
    const idsExcluidos = new Set(idsParaExcluir)
    notificacoes.value = [
      ...novas,
      ...notificacoes.value.filter(n => !idsExcluidos.has(n.id) && !todosOsTipos.includes(n.tipo)),
      ...existentesArr.filter(e => !idsExcluidos.has(e.id) && todosOsTipos.includes(e.tipo)),
    ]
      .filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i) // dedup
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  return { notificacoes, naoLidas, contagem, carregar, marcarLida, marcarTodasLidas, gerarAlertas }
})
