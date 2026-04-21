# Projeto: Controle Financeiro Familiar

## Visão Geral

Aplicação web responsiva para acompanhamento e controle de receitas e despesas familiares. O foco é facilidade de uso no dia a dia, especialmente no celular, sem abrir mão de uma visão completa da saúde financeira da família.

---

## Usuários

| Perfil | Acesso |
|--------|--------|
| Marido | Google OAuth — acesso completo |
| Esposa | Google OAuth — acesso completo |
| Filha  | Google OAuth — acesso completo |

- Todos os membros compartilham os mesmos dados (único núcleo familiar)
- Acesso simultâneo deve ser suportado (sem conflito de dados)
- Sessão persistente — não exige relogin a cada acesso

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vue.js (SPA) |
| Backend / Banco | Supabase (PostgreSQL + Realtime) |
| Autenticação | Supabase Auth com Google OAuth |
| Hospedagem | A definir (Vercel ou Netlify são opções naturais para Vue) |
| Moeda | Real Brasileiro (R$) — única moeda suportada |
| Idioma | Português do Brasil (pt-BR) |

---

## Funcionalidades Principais

### 1. Receitas
- Lançamento de receitas com: valor, data, categoria, descrição, responsável (qual membro da família)
- Categorias de receita (exemplos padrão): Salário, Rendimento de Aplicação, Trabalho Extra, Outros
- Categorias personalizáveis (criar, editar, desativar)

### 2. Despesas
- Lançamento de despesas com: valor, data, categoria, descrição, responsável
- Categorias de despesa (exemplos padrão): Alimentação, Contas (água, luz, internet), Escola, Lazer, Saúde, Transporte, Vestuário, Assinaturas, Outros
- Categorias personalizáveis (criar, editar, desativar)

### 3. Despesas Parceladas
Duas formas de lançamento:
- **Opção A — Valor total:** Informa o valor total e o número de parcelas. O sistema calcula o valor de cada parcela e distribui automaticamente nos meses seguintes.
- **Opção B — Parcela manual:** Informa diretamente o valor de cada parcela e o número total. Útil quando o valor das parcelas já é conhecido (ex: financiamento com juros).

Em ambos os casos o sistema registra a sequência (ex: "Parcela 3/12") e exibe as próximas parcelas a vencer.

### 4. Lançamento Rápido (Mobile)
- Botão de ação flutuante na tela inicial (FAB — Floating Action Button)
- Abre formulário simplificado: **Valor + Categoria + Descrição (opcional)**
- Salva com a data atual por padrão, com opção de alterar
- Objetivo: registrar uma despesa no momento da compra, em poucos segundos

### 5. Orçamento por Categoria
- Definição de limite mensal por categoria de despesa (ex: Lazer = R$ 500/mês)
- Barra de progresso por categoria mostrando quanto do orçamento já foi consumido
- Alertas exibidos no **sino de notificações** dentro do app (sem push notification ativa)
- Alertas disparados ao atingir 80% e 100% do orçamento de uma categoria

### 6. Projeção de Meses Futuros
- Baseada no histórico de lançamentos já registrados:
  - Parcelas futuras confirmadas (já lançadas no sistema)
  - Média histórica por categoria para estimar despesas recorrentes sem lançamento fixo
  - Receitas estimadas com base na média dos últimos meses
- Exibe projeção de saldo para os próximos 3 a 6 meses

### 7. Sino de Notificações (In-App)
- Ícone de sino no cabeçalho do app
- Exibe alertas acumulados ao clicar:
  - Categoria atingiu 80% ou 100% do orçamento
  - Parcelas com vencimento nos próximos 7 dias
  - Saldo do mês projetado negativo
- Sem push notification externa (e-mail ou mobile OS) por ora

---

## Dashboard

Tela principal com visão geral da saúde financeira. Prioridade de exibição:

1. **Saldo do mês atual** — Receitas − Despesas (mês corrente)
2. **Progresso do orçamento por categoria** — barras de consumo vs. limite definido
3. **Gastos por categoria** — gráfico de pizza ou barras do mês atual
4. **Próximas parcelas a vencer** — listagem das parcelas dos próximos 30 dias
5. **Comparativo mês a mês** — gráfico de linha ou barras comparando saldo/gastos dos últimos 6 meses
6. **Projeção dos próximos meses** — resumo do saldo projetado para os próximos 3–6 meses

---

## UX / Design

- **Mobile-first** — layout priorizado para telas pequenas, adaptado para desktop
- **Simplicidade acima de tudo** — poucos cliques para as ações mais comuns
- **Sem exportação de dados** por ora (pode ser adicionado futuramente)
- Interface em português do Brasil
- Sem suporte a múltiplas moedas

---

## Modelo de Dados (Esboço Inicial)

```
familia
  └── membros (users via Supabase Auth)

categorias
  - id, nome, tipo (receita | despesa), icone, cor, padrao, ativa

transacoes
  - id, tipo (receita | despesa), valor, data, descricao
  - categoria_id, membro_id
  - parcelamento_id (nullable)

parcelamentos
  - id, descricao, valor_total, num_parcelas, valor_parcela
  - data_inicio, tipo_calculo (total | parcela_manual)

orcamentos
  - id, categoria_id, valor_limite, mes, ano

notificacoes
  - id, tipo, mensagem, lida, criada_em, membro_id
```

---

## Fora do Escopo (por ora)

- Exportação de dados (CSV, PDF, Excel)
- Notificações por push (e-mail, sistema operacional)
- Múltiplas moedas
- Integração com bancos ou Open Finance
- App nativo (iOS / Android) — por ora PWA responsivo resolve

---

## Roadmap Sugerido

| Fase | Entregas |
|------|----------|
| MVP | Auth Google, lançamento de receitas e despesas, categorias padrão |
| Fase 2 | Parcelamentos, orçamentos por categoria, sino de alertas |
| Fase 3 | Dashboard completo, projeção de meses futuros |
| Fase 4 | Lançamento rápido mobile (FAB), refinamentos de UX |
| Futuro | Exportação, notificações push, relatórios avançados |

---

*Documento gerado em: 2026-04-21*
*Revisão: inicial — baseado em entrevista com o dono do projeto*
