<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">Configurações</h1>

    <!-- Código de convite -->
    <div class="card">
      <h2 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <UsersIcon class="w-4 h-4 text-primary-600" />
        Código da família
      </h2>
      <p class="text-sm text-gray-500 mb-3">Compartilhe este código para que outros membros entrem na sua família.</p>
      <div class="flex items-center gap-2">
        <div class="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono text-xl font-bold text-gray-900 tracking-widest text-center">
          {{ auth.profile?.familias?.codigo_convite ?? '—' }}
        </div>
        <button @click="copiarCodigo" class="btn-secondary gap-2">
          <CopyIcon class="w-4 h-4" />
          {{ copiado ? 'Copiado!' : 'Copiar' }}
        </button>
      </div>
    </div>

    <!-- Cartões de crédito -->
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900 flex items-center gap-2">
          <CreditCardIcon class="w-4 h-4 text-primary-600" />
          Cartões de crédito
        </h2>
        <button @click="abrirFormCartao(null)" class="btn-primary py-1.5 px-3 text-xs">+ Novo</button>
      </div>

      <div v-if="!cartoes.cartoes.length" class="text-sm text-gray-400 py-1">
        Nenhum cartão cadastrado.
      </div>
      <div class="divide-y divide-gray-50">
        <div v-for="c in cartoes.cartoes" :key="c.id" class="flex items-center gap-3 py-2.5">
          <div class="w-7 h-7 rounded-lg flex-shrink-0" :style="{ backgroundColor: c.cor }"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ c.nome }}
              <span v-if="c.ultimos_digitos" class="text-gray-400 font-normal">·· {{ c.ultimos_digitos }}</span>
            </p>
            <p class="text-xs text-gray-400 capitalize">{{ c.bandeira || 'sem bandeira' }}</p>
          </div>
          <span :class="['text-xs px-2 py-0.5 rounded-full', c.ativo ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-400']">
            {{ c.ativo ? 'Ativo' : 'Inativo' }}
          </span>
          <button @click="abrirFormCartao(c)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
            <PencilIcon class="w-4 h-4" />
          </button>
          <button @click="confirmarExclusaoCartao(c)" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-danger transition-colors">
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Categorias -->
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900 flex items-center gap-2">
          <TagIcon class="w-4 h-4 text-primary-600" />
          Categorias
        </h2>
        <button @click="abrirFormCat(null)" class="btn-primary py-1.5 px-3 text-xs">+ Nova</button>
      </div>

      <div class="divide-y divide-gray-50">
        <div v-for="cat in cats.categorias" :key="cat.id" class="flex items-center gap-3 py-2.5">
          <div class="w-7 h-7 rounded-lg flex-shrink-0" :style="{ backgroundColor: cat.cor }"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ cat.nome }}</p>
            <p class="text-xs text-gray-400">{{ cat.tipo === 'receita' ? 'Receita' : 'Despesa' }}</p>
          </div>
          <span :class="['text-xs px-2 py-0.5 rounded-full', cat.ativa ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-400']">
            {{ cat.ativa ? 'Ativa' : 'Inativa' }}
          </span>
          <button @click="abrirFormCat(cat)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
            <PencilIcon class="w-4 h-4" />
          </button>
          <button @click="confirmarExclusaoCat(cat)" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-danger transition-colors">
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Centros de custo -->
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900 flex items-center gap-2">
          <FolderIcon class="w-4 h-4 text-primary-600" />
          Centros de custo
        </h2>
        <button @click="abrirFormCC(null)" class="btn-primary py-1.5 px-3 text-xs">+ Novo</button>
      </div>
      <p class="text-xs text-gray-400 mb-3">Agrupe despesas e receitas por pessoa, projeto ou finalidade (ex: João, Viagem, Trabalho).</p>

      <div v-if="!cc.centros.length" class="text-sm text-gray-400 py-1">Nenhum centro de custo cadastrado.</div>
      <div class="divide-y divide-gray-50">
        <div v-for="c in cc.centros" :key="c.id" class="flex items-center gap-3 py-2.5">
          <div class="w-7 h-7 rounded-lg flex-shrink-0" :style="{ backgroundColor: c.cor }"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ c.nome }}</p>
          </div>
          <span :class="['text-xs px-2 py-0.5 rounded-full', c.ativo ? 'bg-green-100 text-success' : 'bg-gray-100 text-gray-400']">
            {{ c.ativo ? 'Ativo' : 'Inativo' }}
          </span>
          <button @click="abrirFormCC(c)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
            <PencilIcon class="w-4 h-4" />
          </button>
          <button @click="confirmarExclusaoCC(c)" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-danger transition-colors">
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Instalar app -->
    <div class="card">
      <h2 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <SmartphoneIcon class="w-4 h-4 text-primary-600" />
        Instalar app
      </h2>
      <div v-if="podeInstalar">
        <p class="text-sm text-gray-500 mb-3">Adicione na tela inicial do seu celular para acesso rápido.</p>
        <button @click="instalar" class="btn-primary w-full flex items-center justify-center gap-2">
          <DownloadIcon class="w-4 h-4" />
          Instalar no celular
        </button>
      </div>
      <div v-else-if="instalado" class="flex items-center gap-2 text-success text-sm">
        <CheckCircleIcon class="w-4 h-4" />
        App já instalado na tela inicial.
      </div>
      <div v-else-if="isIOS">
        <p class="text-sm text-gray-500 mb-2">No iPhone ou iPad, use o Safari:</p>
        <ol class="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta)</li>
          <li>Selecione <strong>"Adicionar à Tela de Início"</strong></li>
        </ol>
      </div>
      <div v-else>
        <p class="text-sm text-gray-400">Abra o app no Chrome ou Edge para instalar.</p>
      </div>
    </div>

    <!-- Modal cartão (criar / editar) -->
    <div v-if="formCartaoAberto" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="formCartaoAberto = false">
      <div class="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5">
        <h3 class="font-bold text-gray-900 mb-4">{{ editandoCartao ? 'Editar cartão' : 'Novo cartão' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Nome do cartão</label>
            <input v-model="formCartao.nome" class="input" placeholder="Ex: Nubank, Inter, C6" maxlength="40" />
          </div>
          <div>
            <label class="label">Bandeira <span class="text-gray-400 font-normal">(opcional)</span></label>
            <select v-model="formCartao.bandeira" class="input">
              <option value="">Selecione...</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="elo">Elo</option>
              <option value="hipercard">Hipercard</option>
              <option value="amex">American Express</option>
            </select>
          </div>
          <div>
            <label class="label">Últimos 4 dígitos <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input v-model="formCartao.ultimos_digitos" class="input" placeholder="1234" maxlength="4" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Dia de fechamento <span class="text-gray-400 font-normal">(opcional)</span></label>
              <input v-model.number="formCartao.dia_fechamento" type="number" min="1" max="28" class="input" placeholder="Ex: 28" />
              <p class="text-xs text-gray-400 mt-1">Compras após este dia vão para o próximo mês</p>
            </div>
            <div>
              <label class="label">Dia de vencimento <span class="text-gray-400 font-normal">(opcional)</span></label>
              <input v-model.number="formCartao.dia_vencimento" type="number" min="1" max="31" class="input" placeholder="Ex: 10" />
              <p class="text-xs text-gray-400 mt-1">Dia em que a fatura vence no mês seguinte</p>
            </div>
          </div>
          <div>
            <label class="label">Cor</label>
            <input v-model="formCartao.cor" type="color" class="h-10 w-full rounded-lg border border-gray-300 cursor-pointer" />
          </div>
          <div v-if="editandoCartao" class="flex items-center justify-between py-1">
            <span class="text-sm text-gray-700">Ativo</span>
            <button
              type="button"
              @click="formCartao.ativo = !formCartao.ativo"
              :class="['relative w-10 h-6 rounded-full transition-colors', formCartao.ativo ? 'bg-primary-600' : 'bg-gray-200']"
            >
              <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', formCartao.ativo ? 'left-5' : 'left-1']"></span>
            </button>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="formCartaoAberto = false" class="btn-secondary flex-1">Cancelar</button>
            <button @click="salvarCartao" :disabled="!formCartao.nome.trim() || salvandoCartao" class="btn-primary flex-1">
              {{ salvandoCartao ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal categoria (criar / editar) -->
    <div v-if="formCatAberto" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="formCatAberto = false">
      <div class="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5">
        <h3 class="font-bold text-gray-900 mb-4">{{ editandoCat ? 'Editar categoria' : 'Nova categoria' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Nome</label>
            <input v-model="formCat.nome" class="input" placeholder="Ex: Academia" maxlength="40" />
          </div>
          <div v-if="!editandoCat">
            <label class="label">Tipo</label>
            <select v-model="formCat.tipo" class="input">
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <div v-else class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <span class="text-sm text-gray-500">Tipo:</span>
            <span class="text-sm font-medium text-gray-900">{{ formCat.tipo === 'receita' ? 'Receita' : 'Despesa' }}</span>
            <span class="text-xs text-gray-400 ml-1">(não pode ser alterado)</span>
          </div>
          <div>
            <label class="label">Cor</label>
            <div class="flex items-center gap-2">
              <input v-model="formCat.cor" type="color" class="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0" />
              <button
                type="button"
                @click="formCat.cor = gerarCorAleatoria(cats.categorias.map(c => c.cor))"
                class="flex-1 h-10 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <span class="text-base leading-none">🎲</span> Gerar aleatória
              </button>
            </div>
          </div>
          <div v-if="editandoCat" class="flex items-center justify-between py-1">
            <span class="text-sm text-gray-700">Ativa</span>
            <button
              type="button"
              @click="formCat.ativa = !formCat.ativa"
              :class="['relative w-10 h-6 rounded-full transition-colors', formCat.ativa ? 'bg-primary-600' : 'bg-gray-200']"
            >
              <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', formCat.ativa ? 'left-5' : 'left-1']"></span>
            </button>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="formCatAberto = false" class="btn-secondary flex-1">Cancelar</button>
            <button @click="salvarCategoria" :disabled="!formCat.nome.trim() || salvandoCat" class="btn-primary flex-1">
              {{ salvandoCat ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal centro de custo -->
    <div v-if="formCCAberto" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="formCCAberto = false">
      <div class="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5">
        <h3 class="font-bold text-gray-900 mb-4">{{ editandoCC ? 'Editar centro de custo' : 'Novo centro de custo' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Nome</label>
            <input v-model="formCC.nome" class="input" placeholder="Ex: João, Viagem Europa, Trabalho" maxlength="40" />
          </div>
          <div>
            <label class="label">Cor</label>
            <input v-model="formCC.cor" type="color" class="h-10 w-full rounded-lg border border-gray-300 cursor-pointer" />
          </div>
          <div v-if="editandoCC" class="flex items-center justify-between py-1">
            <span class="text-sm text-gray-700">Ativo</span>
            <button
              type="button"
              @click="formCC.ativo = !formCC.ativo"
              :class="['relative w-10 h-6 rounded-full transition-colors', formCC.ativo ? 'bg-primary-600' : 'bg-gray-200']"
            >
              <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', formCC.ativo ? 'left-5' : 'left-1']"></span>
            </button>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="formCCAberto = false" class="btn-secondary flex-1">Cancelar</button>
            <button @click="salvarCC" :disabled="!formCC.nome.trim() || salvandoCC" class="btn-primary flex-1">
              {{ salvandoCC ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal confirmação exclusão -->
    <div v-if="confirmacao" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="confirmacao = null">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div v-if="confirmacao.carregando" class="text-center py-4">
          <div class="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <div v-else>
          <Trash2Icon class="w-10 h-10 text-danger mx-auto mb-3" />
          <p class="font-semibold text-gray-900 text-center mb-1">{{ confirmacao.nome }}</p>

          <div v-if="confirmacao.totalRegistros > 0" class="text-center mb-5">
            <p class="text-sm text-gray-500">
              Possui <strong>{{ confirmacao.totalRegistros }} lançamento(s)</strong> vinculado(s).<br>
              Não é possível excluir — apenas desativar.
            </p>
          </div>
          <div v-else class="text-center mb-5">
            <p class="text-sm text-gray-500">Nenhum lançamento vinculado. Deseja excluir permanentemente?</p>
          </div>

          <div class="flex gap-3">
            <button @click="confirmacao = null" class="btn-secondary flex-1">Cancelar</button>
            <button
              v-if="confirmacao.totalRegistros > 0"
              @click="desativarConfirmado"
              class="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              {{ confirmacao.ativo ? 'Desativar' : 'Reativar' }}
            </button>
            <button
              v-else
              @click="excluirConfirmado"
              class="btn-danger flex-1"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  UsersIcon, CopyIcon, TagIcon, PencilIcon, Trash2Icon,
  SmartphoneIcon, DownloadIcon, CheckCircleIcon, CreditCardIcon, FolderIcon,
} from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useCategoriasStore } from '@/stores/categorias'
import { useCartoesStore } from '@/stores/cartoes'
import { useCentrosCustoStore } from '@/stores/centrosCusto'
import { gerarCorAleatoria } from '@/utils/cores'

const auth    = useAuthStore()
const cats    = useCategoriasStore()
const cartoes = useCartoesStore()
const cc      = useCentrosCustoStore()
const copiado = ref(false)

// --- Copiar código ---
function copiarCodigo() {
  const codigo = auth.profile?.familias?.codigo_convite
  if (!codigo) return
  navigator.clipboard.writeText(codigo)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 2000)
}

// --- PWA install ---
const promptEvento = ref(null)
const podeInstalar = ref(false)
const instalado    = ref(false)
const isIOS        = computed(() => /iphone|ipad|ipod/i.test(navigator.userAgent))

function onBeforeInstallPrompt(e) { e.preventDefault(); promptEvento.value = e; podeInstalar.value = true }
function onAppInstalled()         { podeInstalar.value = false; instalado.value = true }

async function instalar() {
  if (!promptEvento.value) return
  promptEvento.value.prompt()
  const { outcome } = await promptEvento.value.userChoice
  if (outcome === 'accepted') instalado.value = true
  podeInstalar.value = false
  promptEvento.value = null
}

// --- Form cartão ---
const formCartaoAberto = ref(false)
const salvandoCartao   = ref(false)
const editandoCartao   = ref(null)
const formCartao = ref({ nome: '', bandeira: '', ultimos_digitos: '', cor: '#6366f1', dia_fechamento: null, dia_vencimento: null })

function abrirFormCartao(c) {
  editandoCartao.value = c
  formCartao.value = c
    ? { nome: c.nome, bandeira: c.bandeira ?? '', ultimos_digitos: c.ultimos_digitos ?? '', cor: c.cor, ativo: c.ativo, dia_fechamento: c.dia_fechamento ?? null, dia_vencimento: c.dia_vencimento ?? null }
    : { nome: '', bandeira: '', ultimos_digitos: '', cor: '#6366f1', ativo: true, dia_fechamento: null, dia_vencimento: null }
  formCartaoAberto.value = true
}

async function salvarCartao() {
  salvandoCartao.value = true
  try {
    const payload = {
      nome:            formCartao.value.nome.trim(),
      bandeira:        formCartao.value.bandeira || null,
      ultimos_digitos: formCartao.value.ultimos_digitos || null,
      cor:             formCartao.value.cor,
      dia_fechamento:  formCartao.value.dia_fechamento || null,
      dia_vencimento:  formCartao.value.dia_vencimento || null,
      ...(editandoCartao.value ? { ativo: formCartao.value.ativo } : {}),
    }
    if (editandoCartao.value) {
      await cartoes.atualizar(editandoCartao.value.id, payload)
    } else {
      await cartoes.criar(payload)
    }
    formCartaoAberto.value = false
  } finally {
    salvandoCartao.value = false
  }
}

// --- Form categoria ---
const formCatAberto = ref(false)
const salvandoCat   = ref(false)
const editandoCat   = ref(null)
const formCat = ref({ nome: '', tipo: 'despesa', cor: '#6366f1' })

function abrirFormCat(cat) {
  editandoCat.value = cat
  formCat.value = cat
    ? { nome: cat.nome, tipo: cat.tipo, cor: cat.cor, ativa: cat.ativa }
    : { nome: '', tipo: 'despesa', cor: gerarCorAleatoria(cats.categorias.map(c => c.cor)), ativa: true }
  formCatAberto.value = true
}

async function salvarCategoria() {
  salvandoCat.value = true
  try {
    if (editandoCat.value) {
      await cats.atualizar(editandoCat.value.id, { nome: formCat.value.nome.trim(), cor: formCat.value.cor, ativa: formCat.value.ativa })
    } else {
      await cats.criar({ nome: formCat.value.nome.trim(), tipo: formCat.value.tipo, cor: formCat.value.cor })
    }
    formCatAberto.value = false
  } finally {
    salvandoCat.value = false
  }
}

// --- Confirmação exclusão / desativação ---
const confirmacao = ref(null)

async function confirmarExclusaoCartao(c) {
  confirmacao.value = { tipo: 'cartao', id: c.id, nome: c.nome, ativo: c.ativo, carregando: true, totalRegistros: 0 }
  const { count } = await supabase
    .from('transacoes')
    .select('id', { count: 'exact', head: true })
    .eq('cartao_id', c.id)
  confirmacao.value = { ...confirmacao.value, carregando: false, totalRegistros: count ?? 0 }
}

async function confirmarExclusaoCat(cat) {
  confirmacao.value = { tipo: 'categoria', id: cat.id, nome: cat.nome, ativo: cat.ativa, carregando: true, totalRegistros: 0 }
  const { count } = await supabase
    .from('transacoes')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', cat.id)
  confirmacao.value = { ...confirmacao.value, carregando: false, totalRegistros: count ?? 0 }
}

async function desativarConfirmado() {
  const { tipo, id, ativo } = confirmacao.value
  if (tipo === 'cartao')    await cartoes.atualizar(id, { ativo: !ativo })
  else if (tipo === 'cc')   await cc.atualizar(id, { ativo: !ativo })
  else                      await cats.toggleAtiva(id)
  confirmacao.value = null
}

async function excluirConfirmado() {
  const { tipo, id } = confirmacao.value
  if (tipo === 'cartao')    await cartoes.remover(id)
  else if (tipo === 'cc')   await cc.remover(id)
  else                      await cats.remover(id)
  confirmacao.value = null
}

// --- Centro de custo ---
const formCCAberto = ref(false)
const salvandoCC   = ref(false)
const editandoCC   = ref(null)
const formCC = ref({ nome: '', cor: '#6366f1', ativo: true })

function abrirFormCC(c) {
  editandoCC.value = c
  formCC.value = c
    ? { nome: c.nome, cor: c.cor, ativo: c.ativo }
    : { nome: '', cor: '#6366f1', ativo: true }
  formCCAberto.value = true
}

async function salvarCC() {
  salvandoCC.value = true
  try {
    const payload = { nome: formCC.value.nome.trim(), cor: formCC.value.cor }
    if (editandoCC.value) {
      await cc.atualizar(editandoCC.value.id, { ...payload, ativo: formCC.value.ativo })
    } else {
      await cc.criar(payload)
    }
    formCCAberto.value = false
  } finally {
    salvandoCC.value = false
  }
}

async function confirmarExclusaoCC(c) {
  confirmacao.value = { tipo: 'cc', id: c.id, nome: c.nome, ativo: c.ativo, carregando: true, totalRegistros: 0 }
  const { count } = await supabase
    .from('transacoes')
    .select('id', { count: 'exact', head: true })
    .eq('centro_custo_id', c.id)
  confirmacao.value = { ...confirmacao.value, carregando: false, totalRegistros: count ?? 0 }
}

onMounted(() => {
  cats.carregar()
  cartoes.carregar()
  cc.carregar()
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})
</script>
