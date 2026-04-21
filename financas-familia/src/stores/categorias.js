import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useCategoriasStore = defineStore('categorias', () => {
  const auth       = useAuthStore()
  const categorias = ref([])
  const loading    = ref(false)

  const receitas = computed(() => categorias.value.filter(c => c.tipo === 'receita' && c.ativa))
  const despesas = computed(() => categorias.value.filter(c => c.tipo === 'despesa' && c.ativa))

  async function carregar() {
    if (!auth.familiaId) return
    loading.value = true
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .eq('familia_id', auth.familiaId)
      .order('nome')
    categorias.value = data ?? []
    loading.value = false
  }

  async function criar(payload) {
    const { data, error } = await supabase
      .from('categorias')
      .insert({ ...payload, familia_id: auth.familiaId })
      .select()
      .single()
    if (error) throw error
    categorias.value.push(data)
    return data
  }

  async function atualizar(id, payload) {
    const { data, error } = await supabase
      .from('categorias')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = categorias.value.findIndex(c => c.id === id)
    if (idx !== -1) categorias.value[idx] = data
    return data
  }

  async function toggleAtiva(id) {
    const cat = categorias.value.find(c => c.id === id)
    if (!cat) return
    return atualizar(id, { ativa: !cat.ativa })
  }

  async function remover(id) {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) throw error
    categorias.value = categorias.value.filter(c => c.id !== id)
  }

  return { categorias, loading, receitas, despesas, carregar, criar, atualizar, toggleAtiva, remover }
})
