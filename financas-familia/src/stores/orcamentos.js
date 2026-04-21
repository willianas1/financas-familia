import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useOrcamentosStore = defineStore('orcamentos', () => {
  const auth      = useAuthStore()
  const orcamentos = ref([])
  const loading    = ref(false)

  async function carregar(mes, ano) {
    if (!auth.familiaId) return
    loading.value = true
    const { data } = await supabase
      .from('orcamentos')
      .select('*, categorias(nome, cor, icone)')
      .eq('familia_id', auth.familiaId)
      .eq('mes', mes)
      .eq('ano', ano)
    orcamentos.value = data ?? []
    loading.value = false
  }

  async function salvar(payload) {
    const { categoria_id, valor_limite, mes, ano } = payload
    const { data, error } = await supabase
      .from('orcamentos')
      .upsert({ familia_id: auth.familiaId, categoria_id, valor_limite, mes, ano },
               { onConflict: 'familia_id,categoria_id,mes,ano' })
      .select('*, categorias(nome, cor, icone)')
      .single()
    if (error) throw error
    const idx = orcamentos.value.findIndex(o => o.categoria_id === categoria_id)
    if (idx !== -1) orcamentos.value[idx] = data
    else orcamentos.value.push(data)
    return data
  }

  async function remover(id) {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) throw error
    orcamentos.value = orcamentos.value.filter(o => o.id !== id)
  }

  return { orcamentos, loading, carregar, salvar, remover }
})
