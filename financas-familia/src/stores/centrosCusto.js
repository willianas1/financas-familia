import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useCentrosCustoStore = defineStore('centrosCusto', () => {
  const auth   = useAuthStore()
  const centros = ref([])

  const ativos = computed(() => centros.value.filter(c => c.ativo))

  async function carregar() {
    if (!auth.familiaId) return
    const { data } = await supabase
      .from('centros_custo')
      .select('*')
      .eq('familia_id', auth.familiaId)
      .order('nome')
    centros.value = data ?? []
  }

  async function criar(payload) {
    const { data, error } = await supabase
      .from('centros_custo')
      .insert({ ...payload, familia_id: auth.familiaId })
      .select()
      .single()
    if (error) throw error
    centros.value.push(data)
    return data
  }

  async function atualizar(id, payload) {
    const { data, error } = await supabase
      .from('centros_custo')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = centros.value.findIndex(c => c.id === id)
    if (idx !== -1) centros.value[idx] = data
  }

  async function toggleAtivo(id) {
    const c = centros.value.find(c => c.id === id)
    if (!c) return
    await atualizar(id, { ativo: !c.ativo })
  }

  async function remover(id) {
    const { error } = await supabase.from('centros_custo').delete().eq('id', id)
    if (error) throw error
    centros.value = centros.value.filter(c => c.id !== id)
  }

  return { centros, ativos, carregar, criar, atualizar, toggleAtivo, remover }
})
