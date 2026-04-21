<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
      <div class="mb-8">
        <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <WalletIcon class="w-8 h-8 text-primary-600" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Finanças da Família</h1>
        <p class="text-gray-500 mt-2 text-sm">Controle financeiro simples e colaborativo</p>
      </div>

      <button
        @click="entrar"
        :disabled="carregando"
        class="btn-primary w-full py-3 text-base gap-3"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google" />
        <span>{{ carregando ? 'Aguarde...' : 'Entrar com Google' }}</span>
      </button>

      <p class="text-xs text-gray-400 mt-6">
        Ao entrar, você concorda com o uso dos dados para fins familiares.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { WalletIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth      = useAuthStore()
const carregando = ref(false)

async function entrar() {
  carregando.value = true
  try {
    await auth.loginGoogle()
  } catch {
    carregando.value = false
  }
}
</script>
