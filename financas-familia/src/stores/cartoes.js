import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useCartoesStore = defineStore('cartoes', () => {
  const auth    = useAuthStore()
  const cartoes = ref([])

  const ativos = computed(() => cartoes.value.filter(c => c.ativo))

  async function carregar() {
    if (!auth.familiaId) return
    const { data } = await supabase
      .from('cartoes_credito')
      .select('*')
      .eq('familia_id', auth.familiaId)
      .order('nome')
    cartoes.value = data ?? []
  }

  async function criar(payload) {
    const { data, error } = await supabase
      .from('cartoes_credito')
      .insert({ ...payload, familia_id: auth.familiaId })
      .select()
      .single()
    if (error) throw error
    cartoes.value.push(data)
  }

  async function toggleAtivo(id) {
    const cartao = cartoes.value.find(c => c.id === id)
    if (!cartao) return
    await supabase.from('cartoes_credito').update({ ativo: !cartao.ativo }).eq('id', id)
    cartao.ativo = !cartao.ativo
  }

  return { cartoes, ativos, carregar, criar, toggleAtivo }
})
