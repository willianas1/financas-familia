<template>
  <!-- Bottom navigation (mobile) -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 md:hidden">
    <div class="flex">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-gray-400 transition-colors"
        active-class="text-primary-600"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>

  <!-- Sidebar (desktop) -->
  <aside class="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 min-h-screen sticky top-14 self-start">
    <nav class="p-3 flex flex-col gap-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 text-sm font-medium transition-colors hover:bg-gray-50"
        active-class="bg-primary-50 text-primary-700"
      >
        <component :is="item.icon" class="w-5 h-5" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { LayoutDashboardIcon, ListIcon, TargetIcon, SettingsIcon } from 'lucide-vue-next'

const navItems = [
  { to: '/',              label: 'Início',       icon: LayoutDashboardIcon },
  { to: '/lancamentos',   label: 'Lançamentos',  icon: ListIcon },
  { to: '/orcamentos',    label: 'Orçamentos',   icon: TargetIcon },
  { to: '/configuracoes', label: 'Config.',      icon: SettingsIcon },
]
</script>
