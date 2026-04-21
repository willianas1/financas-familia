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

    // Remove alertas de orçamento não lidos anteriores para recriar com estado atual
    await supabase
      .from('notificacoes')
      .delete()
      .eq('familia_id', auth.familiaId)
      .eq('lida', false)
      .in('tipo', ['orcamento_80', 'orcamento_100'])

    const alertas = []
    for (const orc of orcamentos) {
      const gasto = transacoesMes
        .filter(t => t.tipo === 'despesa' && t.categoria_id === orc.categoria_id)
        .reduce((s, t) => s + Number(t.valor), 0)
      const pct = gasto / orc.valor_limite

      if (pct >= 1) {
        alertas.push({ tipo: 'orcamento_100', mensagem: `Orçamento de "${orc.categorias?.nome}" atingido (100%)!` })
      } else if (pct >= 0.8) {
        alertas.push({ tipo: 'orcamento_80', mensagem: `Orçamento de "${orc.categorias?.nome}" em 80%.` })
      }
    }

    if (alertas.length) {
      const novos = alertas.map(a => ({ ...a, familia_id: auth.familiaId, lida: false }))
      const { data } = await supabase.from('notificacoes').insert(novos).select()
      // Mantém notificações de outros tipos + adiciona as novas de orçamento
      notificacoes.value = [
        ...(data ?? []),
        ...notificacoes.value.filter(n => !['orcamento_80', 'orcamento_100'].includes(n.tipo)),
      ]
    } else {
      notificacoes.value = notificacoes.value.filter(n => !['orcamento_80', 'orcamento_100'].includes(n.tipo))
    }
  }

  return { notificacoes, naoLidas, contagem, carregar, marcarLida, marcarTodasLidas, gerarAlertas }
})
