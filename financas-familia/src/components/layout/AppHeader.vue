<template>
  <header class="bg-white border-b border-gray-100 sticky top-0 z-40">
    <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <WalletIcon class="w-6 h-6 text-primary-600" />
        <span class="font-bold text-gray-900 hidden sm:inline">Finanças Família</span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Sino de notificações -->
        <div class="relative">
          <button
            @click.stop="sinoAberto = !sinoAberto; menuAberto = false"
            class="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <BellIcon class="w-5 h-5 text-gray-600" />
            <span
              v-if="notificacoes.contagem > 0"
              class="absolute -top-0.5 -right-0.5 bg-danger text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
            >
              {{ notificacoes.contagem > 9 ? '9+' : notificacoes.contagem }}
            </span>
          </button>

          <!-- Dropdown notificações -->
          <Transition name="dropdown">
            <div
              v-if="sinoAberto"
              v-click-outside="() => sinoAberto = false"
              class="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span class="font-semibold text-sm text-gray-900">Notificações</span>
                <button
                  v-if="notificacoes.contagem > 0"
                  @click="notificacoes.marcarTodasLidas(); sinoAberto = false"
                  class="text-xs text-primary-600 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              </div>
              <div class="max-h-72 overflow-y-auto">
                <div v-if="!notificacoes.notificacoes.length" class="py-8 text-center text-gray-400 text-sm">
                  Nenhuma notificação
                </div>
                <div
                  v-for="n in notificacoes.notificacoes"
                  :key="n.id"
                  :class="['flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                           !n.lida && 'bg-primary-50']"
                  @click="notificacoes.marcarLida(n.id)"
                >
                  <div :class="['mt-0.5 w-2 h-2 rounded-full flex-shrink-0', !n.lida ? 'bg-primary-500' : 'bg-gray-200']"></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-800 leading-snug">{{ n.mensagem }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ formatarData(n.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Avatar usuário -->
        <div class="relative">
          <button
            @click.stop="menuAberto = !menuAberto; sinoAberto = false"
            class="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <img
              v-if="auth.user?.user_metadata?.avatar_url"
              :src="auth.user.user_metadata.avatar_url"
              class="w-8 h-8 rounded-full"
              alt="Avatar"
            />
            <div v-else class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
              {{ iniciais }}
            </div>
          </button>

          <Transition name="dropdown">
            <div
              v-if="menuAberto"
              v-click-outside="() => menuAberto = false"
              class="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              <!-- Info do usuário -->
              <div class="px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-3 mb-1">
                  <img
                    v-if="auth.user?.user_metadata?.avatar_url"
                    :src="auth.user.user_metadata.avatar_url"
                    class="w-9 h-9 rounded-full"
                  />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ auth.user?.user_metadata?.full_name }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ auth.user?.email }}</p>
                  </div>
                </div>
                <div v-if="auth.profile?.familias?.nome" class="text-xs text-primary-600 font-medium mt-1">
                  Família: {{ auth.profile.familias.nome }}
                </div>
              </div>

              <!-- Ações -->
              <RouterLink
                to="/configuracoes"
                @click="menuAberto = false"
                class="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <SettingsIcon class="w-4 h-4 text-gray-400" />
                Configurações
              </RouterLink>

              <button
                @click="sair"
                class="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <LogOutIcon class="w-4 h-4" />
                Sair
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { WalletIcon, BellIcon, LogOutIcon, SettingsIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/notificacoes'

const auth         = useAuthStore()
const notificacoes = useNotificacoesStore()
const router       = useRouter()
const sinoAberto   = ref(false)
const menuAberto   = ref(false)

const iniciais = computed(() => {
  const nome = auth.user?.user_metadata?.full_name ?? ''
  return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
})

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function sair() {
  menuAberto.value = false
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
