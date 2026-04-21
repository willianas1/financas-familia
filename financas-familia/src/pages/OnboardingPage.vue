<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UsersIcon class="w-8 h-8 text-primary-600" />
        </div>
        <h1 class="text-xl font-bold text-gray-900">Configurar Família</h1>
        <p class="text-gray-500 mt-1 text-sm">Bem-vindo, {{ auth.user?.user_metadata?.full_name?.split(' ')[0] }}!</p>
      </div>

      <!-- Tabs -->
      <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="abaAtiva = tab.id"
          :class="['flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                   abaAtiva === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500']"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Criar família -->
      <div v-if="abaAtiva === 'criar'">
        <label class="label">Nome da família</label>
        <input v-model="nomeFamilia" class="input mb-4" placeholder="Ex: Família Silva" maxlength="60" />
        <button @click="criarFamilia" :disabled="!nomeFamilia.trim() || carregando" class="btn-primary w-full">
          {{ carregando ? 'Criando...' : 'Criar família' }}
        </button>
      </div>

      <!-- Entrar com código -->
      <div v-else>
        <label class="label">Código de convite</label>
        <input
          v-model="codigoConvite"
          class="input mb-1 tracking-widest uppercase text-center text-lg font-mono"
          placeholder="A3F9B2C1"
          maxlength="8"
        />
        <p class="text-xs text-gray-400 mb-4">Peça o código para quem criou a família.</p>
        <button @click="entrarFamilia" :disabled="codigoConvite.length < 8 || carregando" class="btn-primary w-full">
          {{ carregando ? 'Entrando...' : 'Entrar na família' }}
        </button>
      </div>

      <p v-if="erro" class="text-danger text-sm text-center mt-4">{{ erro }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UsersIcon } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const auth     = useAuthStore()
const router   = useRouter()
const abaAtiva = ref('criar')
const tabs     = [{ id: 'criar', label: 'Nova família' }, { id: 'entrar', label: 'Entrar com código' }]

const nomeFamilia    = ref('')
const codigoConvite  = ref('')
const carregando     = ref(false)
const erro           = ref('')

async function criarFamilia() {
  erro.value = ''
  carregando.value = true
  try {
    const { data: familia, error: errF } = await supabase
      .from('familias')
      .insert({ nome: nomeFamilia.value.trim() })
      .select()
      .single()
    if (errF) throw errF

    const { error: errP } = await supabase
      .from('profiles')
      .update({ familia_id: familia.id })
      .eq('id', auth.user.id)
    if (errP) throw errP

    const { error: errRpc } = await supabase.rpc('seed_categorias_padrao', { p_familia_id: familia.id })
    if (errRpc) console.warn('seed categorias:', errRpc)

    await auth.carregarProfile()
    router.push('/')
  } catch (e) {
    erro.value = `Erro: ${e?.message ?? 'Tente novamente.'}`
  } finally {
    carregando.value = false
  }
}

async function entrarFamilia() {
  erro.value = ''
  carregando.value = true
  try {
    const { data: familia, error: errF } = await supabase
      .from('familias')
      .select('id')
      .eq('codigo_convite', codigoConvite.value.toUpperCase())
      .single()
    if (errF || !familia) throw new Error('Código inválido')

    const { error: errP } = await supabase
      .from('profiles')
      .update({ familia_id: familia.id })
      .eq('id', auth.user.id)
    if (errP) throw errP

    await auth.carregarProfile()
    router.push('/')
  } catch {
    erro.value = 'Código não encontrado. Verifique e tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>
