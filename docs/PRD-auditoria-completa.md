# PRD — Auditoria Completa do Sistema ACIAV Saúde
**Data**: 23/03/2026
**Versão**: 1.0
**Status**: Documento de referência técnico

---

## 1. VISÃO GERAL DO SISTEMA

**Stack**: Next.js 16 (frontend) + NestJS (backend) + PostgreSQL via Prisma
**Arquitetura**: Monorepo (Turborepo) — `apps/web-admin`, `apps/api-core`, `packages/database`
**Modelo**: SaaS Multi-tenant com isolamento por `unitId`
**Deploy**: VPS Hostinger — domínio `aciavsaude.com.br` — HTTPS ativo via Let's Encrypt

---

## 2. PERFIS DE ACESSO

| Perfil | Role | Portal | Home após login |
|--------|------|--------|----------------|
| Super Admin | `super_admin` | Admin | `/dashboard` |
| Admin Unidade | `admin_unit` | Admin | `/dashboard` |
| RH | `rh` | RH | `/portal-rh` |
| Credenciado | `provider` | Credenciado | `/portal-credenciado` |
| Paciente | `patient` | Paciente | `/portal-paciente` |

---

## 3. MAPA COMPLETO DE PÁGINAS E STATUS

### 3.1 Portal Admin (`super_admin` + `admin_unit`)

| Rota | Arquivo | Acesso | Status | Dados Reais |
|------|---------|--------|--------|-------------|
| `/dashboard` | `(admin)/dashboard/page.tsx` | ambos | ✅ Implementado | ✅ Sim |
| `/beneficiarios` | `BeneficiariosClient.tsx` | admin_unit | ✅ Implementado | ✅ Sim |
| `/empresas` | `EmpresasClient.tsx` | admin_unit | ✅ Implementado | ✅ Sim |
| `/credenciados` | `CredenciadosClient.tsx` | admin_unit | ✅ Implementado | ✅ Sim |
| `/unidades` | `UnidadesClient.tsx` | super_admin | ✅ Implementado | ✅ Sim |
| `/admin-users` | `AdminUsersClient.tsx` | super_admin | ✅ Implementado | ✅ Sim |
| `/premios` | `premios/page.tsx` | admin_unit | ⚠️ UI mockada | ❌ Dados fake |
| `/faturamento` | `faturamento/page.tsx` | super_admin | ❌ Placeholder | ❌ Não |
| `/relatorios` | `relatorios/page.tsx` | admin_unit | ❌ Placeholder | ❌ Não |
| `/configuracoes` | `configuracoes/page.tsx` | ambos | ⚠️ UI sem backend | ❌ Não salva |

### 3.2 Portal RH (`rh`)

| Rota | Arquivo | Status | Dados Reais |
|------|---------|--------|-------------|
| `/portal-rh` | `portal-rh/page.tsx` | ✅ Implementado | ✅ Sim |
| `/portal-rh/colaboradores` | `ColaboradoresRHClient.tsx` | ✅ Implementado | ✅ Sim |
| `/portal-rh/dependentes` | `dependentes/page.tsx` | ✅ View-only | ✅ Sim |
| `/portal-rh/importar` | `ImportarClient.tsx` | ✅ Implementado | ✅ Sim |
| `/portal-rh/relatorios` | `relatorios/page.tsx` | ✅ Métricas básicas | ✅ Sim |

### 3.3 Portal Credenciado (`provider`)

| Rota | Arquivo | Status | Dados Reais |
|------|---------|--------|-------------|
| `/portal-credenciado` | `page.tsx` | ⚠️ UI mockada | ❌ Dados hardcoded |
| `/portal-credenciado/servicos` | NÃO EXISTE | ❌ Não implementado | ❌ Não |
| `/portal-credenciado/historico` | NÃO EXISTE | ❌ Não implementado | ❌ Não |
| `/portal-credenciado/gamificacao` | NÃO EXISTE | ❌ Não implementado | ❌ Não |
| `/portal-credenciado/configuracoes` | NÃO EXISTE | ❌ Não implementado | ❌ Não |

### 3.4 Portal Paciente (`patient`)

| Rota | Arquivo | Status | Dados Reais |
|------|---------|--------|-------------|
| `/portal-paciente` | `page.tsx` | ⚠️ UI mockada | ❌ Dados hardcoded ("SAULO MACHADO", "R$ 1.250,00") |
| `/portal-paciente/dependentes` | `page.tsx` existe | ❌ Sem conteúdo | ❌ Não |
| `/portal-paciente/guia` | `page.tsx` existe | ❌ Sem conteúdo | ❌ Não |
| `/portal-paciente/historico` | `page.tsx` existe | ❌ Sem conteúdo | ❌ Não |
| `/portal-paciente/premios` | `page.tsx` existe | ❌ Sem conteúdo | ❌ Não |
| `/portal-paciente/configuracoes` | `page.tsx` existe | ❌ Sem conteúdo | ❌ Não |

### 3.5 Páginas Públicas

| Rota | Status |
|------|--------|
| `/` | ✅ Landing Page com logo, features, CTA |
| `/login` | ✅ Funcional com branding |

---

## 4. AUDITORIA DE BOTÕES (página por página)

### 4.1 `/dashboard` — Admin
| Botão | Ação | Funciona? |
|-------|------|-----------|
| "Últimos 6 Meses" (datepicker) | Filtrar período do gráfico | ❌ Sem ação |

### 4.2 `/beneficiarios`
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Novo Beneficiário | Abre modal de criação | ✅ Sim |
| Cancelar (modal) | Fecha modal | ✅ Sim |
| Cadastrar / Salvar | POST/PUT `/users` | ✅ Sim |
| Ativo / Inativo (badge) | PATCH `/users/:id/status` | ✅ Sim |
| Ícone Editar | Abre modal de edição | ✅ Sim |
| Ícone Deletar | Inativa beneficiário | ✅ Sim |
| Ícone Histórico | Ver histórico de uso | ❌ Sem ação |
| Ícone Carteirinha | Ver carteirinha | ❌ Sem ação |

### 4.3 `/empresas`
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Nova Empresa | Abre modal de criação | ✅ Sim |
| Cancelar (modal) | Fecha modal | ✅ Sim |
| Cadastrar / Salvar | POST/PUT `/companies` | ✅ Sim |
| Ativo / Inativo (badge) | PATCH `/companies/:id/status` | ✅ Sim |
| Ícone Editar | Abre modal de edição | ✅ Sim |
| Ícone Deletar | Inativa empresa | ✅ Sim |
| Importar Planilha | Importar empresas via CSV | ❌ Sem ação |
| Exportar | Exportar lista | ❌ Sem ação |

### 4.4 `/credenciados`
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Novo Credenciado | Abre modal de criação | ✅ Sim |
| Cancelar (modal) | Fecha modal | ✅ Sim |
| Cadastrar / Salvar | POST/PUT `/providers` | ✅ Sim |
| Ativo / Inativo (badge) | PATCH `/providers/:id/status` | ✅ Sim |
| Ícone Editar | Abre modal de edição | ✅ Sim |
| Ícone Deletar | Inativa credenciado | ✅ Sim |

### 4.5 `/unidades` (super_admin)
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Nova Unidade | Abre modal de criação | ✅ Sim |
| Cancelar (modal) | Fecha modal | ✅ Sim |
| Criar / Salvar | POST/PUT `/units` | ✅ Sim |
| Ativo / Inativo (badge) | Atualiza status | ✅ Sim |
| Ícone Editar (super_admin) | Abre modal de edição | ✅ Sim |
| White Label | Configurar visual | ❌ Sem ação |

### 4.6 `/admin-users` (super_admin)
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Novo Admin | Abre modal de criação | ✅ Sim |
| Cancelar (modal) | Fecha modal | ✅ Sim |
| Criar Usuário | POST `/auth/admin-users` | ✅ Sim |
| Ativo / Inativo (badge) | PATCH `/auth/admin-users/:id/status` | ✅ Sim |
| Ícone Editar | Editar admin | ❌ Sem ação |

### 4.7 `/premios` (admin_unit)
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Novo Brinde | Criar brinde | ❌ Sem ação |
| Processar Resgate | Processar voucher | ❌ Sem ação |
| Editar (catálogo) | Editar brinde | ❌ Sem ação |

### 4.8 `/configuracoes`
| Botão | Ação | Funciona? |
|-------|------|-----------|
| Aparência (White Label) | Aba de configuração | ✅ Troca seção (UI) |
| Permissões de Acesso | Aba | ❌ Sem conteúdo |
| Segurança / Autenticação | Aba | ❌ Sem conteúdo |
| Backup & Integrações | Aba | ❌ Sem conteúdo |
| Salvar Alterações | Salvar no banco | ❌ Não salva nada |

### 4.9 `/portal-rh` (dashboard RH)
| Botão | Ação | Funciona? |
|-------|------|-----------|
| Importar Planilha | Link → `/portal-rh/importar` | ✅ Sim |
| Ver Colaboradores | Link → `/portal-rh/colaboradores` | ✅ Sim |
| Ver todos | Link → `/portal-rh/colaboradores` | ✅ Sim |

### 4.10 `/portal-rh/colaboradores`
| Botão | Ação | Funciona? |
|-------|------|-----------|
| + Novo Colaborador | Abre modal de criação | ✅ Sim |
| Cancelar (modal) | Fecha modal | ✅ Sim |
| Cadastrar | POST `/users` (titular) | ✅ Sim |
| Ativo / Inativo (badge) | PATCH `/users/:id/status` | ✅ Sim |

### 4.11 `/portal-rh/importar`
| Botão | Ação | Funciona? |
|-------|------|-----------|
| Baixar modelo CSV | Download template | ✅ Sim |
| Selecionar arquivo | Upload CSV | ✅ Sim |
| X (remover arquivo) | Limpa seleção | ✅ Sim |
| Importar Colaboradores | POST `/users/import` | ✅ Sim |

### 4.12 `/portal-credenciado` (mockado)
| Botão | Ação | Funciona? |
|-------|------|-----------|
| Validar CPF | Buscar paciente | ❌ Sem ação |
| Quem será atendido? (select) | Selecionar beneficiário | ❌ Hardcoded |
| Selecione o Serviço (select) | Selecionar serviço | ❌ Hardcoded |
| Registrar Uso do Benefício | Lançar transação | ❌ Sem ação |

---

## 5. MENUS / SIDEBARS — STATUS DOS LINKS

### Sidebar Admin (`Sidebar.tsx`)

**Super Admin:**
| Item | Link | Página existe? |
|------|------|----------------|
| Dashboard Global | `/dashboard` | ✅ |
| Unidades | `/unidades` | ✅ |
| Usuários Admin | `/admin-users` | ✅ |
| Faturamento | `/faturamento` | ✅ (placeholder) |
| Configurações | `/configuracoes` | ✅ (UI sem backend) |

**Admin Unidade:**
| Item | Link | Página existe? |
|------|------|----------------|
| Dashboard | `/dashboard` | ✅ |
| Beneficiários | `/beneficiarios` | ✅ |
| Empresas (RH) | `/empresas` | ✅ |
| Credenciados | `/credenciados` | ✅ |
| Relatórios | `/relatorios` | ✅ (placeholder) |
| Gamificação | `/premios` | ✅ (UI mockada) |
| Configurações | `/configuracoes` | ✅ (UI sem backend) |

### SidebarRH (`SidebarRH.tsx`)
| Item | Link | Página existe? |
|------|------|----------------|
| Dashboard | `/portal-rh` | ✅ |
| Colaboradores | `/portal-rh/colaboradores` | ✅ |
| Dependentes | `/portal-rh/dependentes` | ✅ (view-only) |
| Importar Planilha | `/portal-rh/importar` | ✅ |
| Relatórios | `/portal-rh/relatorios` | ✅ (métricas básicas) |

### SidebarCred (`SidebarCred.tsx`)
| Item | Link | Página existe? |
|------|------|----------------|
| Novo Atendimento | `/portal-credenciado` | ✅ (mockado) |
| Meus Serviços | `/portal-credenciado/servicos` | ❌ 404 |
| Histórico & Faturamento | `/portal-credenciado/historico` | ❌ 404 |
| Gamificação (Dar Pontos) | `/portal-credenciado/gamificacao` | ❌ 404 |
| Configurações | `/portal-credenciado/configuracoes` | ❌ 404 |

### SidebarPaciente (`SidebarPaciente.tsx`)
| Item | Link | Página existe? |
|------|------|----------------|
| Minha Carteirinha | `/portal-paciente` | ✅ (mockada) |
| Dependentes | `/portal-paciente/dependentes` | ✅ (sem conteúdo) |
| Guia Médico | `/portal-paciente/guia` | ✅ (sem conteúdo) |
| Meu Histórico de Uso | `/portal-paciente/historico` | ✅ (sem conteúdo) |
| Resgatar Prêmios | `/portal-paciente/premios` | ✅ (sem conteúdo) |
| Configurações | `/portal-paciente/configuracoes` | ✅ (sem conteúdo) |

---

## 6. MULTI-TENANCY — ISOLAMENTO DE DADOS

### 6.1 Schema do Banco — Modelos e Isolamento

```
Unit          → raiz do multi-tenancy
  ├── Company (unitId obrigatório)
  ├── User    (unitId obrigatório)
  └── Provider (unitId obrigatório)
       ├── Service (herdado via providerId)
       ├── Transaction (herdado via userId/providerId)
       └── Reward (herdado via providerId)

AuthUser → credenciais de acesso (unitId opcional — null = super_admin)
Session  → sessões JWT (FK authUserId)
```

### 6.2 Status do Isolamento por Endpoint

| Endpoint | Filtra por unitId? | Observação |
|----------|--------------------|------------|
| `GET /users` | ✅ Sim | Query param `unitId` |
| `POST /users` | ✅ Sim | unitId obrigatório no body |
| `GET /companies` | ✅ Sim | Query param `unitId` |
| `POST /companies` | ✅ Sim | unitId obrigatório no body |
| `GET /providers` | ✅ Sim | Query param `unitId` |
| `POST /providers` | ✅ Sim | unitId obrigatório no body |
| `GET /stats/dashboard` | ✅ Sim | Query param `unitId` |
| `GET /stats/company` | ✅ Sim | Query param `companyId` |
| `GET /stats/global` | ⚠️ Sem filtro | Retorna tudo — deveria exigir super_admin |
| `GET /units` | ⚠️ Sem filtro | Retorna todas — deveria exigir super_admin |
| `POST /auth/admin-users` | ⚠️ Sem validação de role | Qualquer JWT pode criar admin |

### 6.3 Criação de Novas Unidades

**Funcional**: ✅ Sim

- **Frontend**: `/unidades` (super_admin only)
- **Endpoint**: `POST /units` com `{ name, subdomain, settings? }`
- **Isolamento automático**: ao criar Unit, todos os dados criados com esse `unitId` ficam isolados
- **Subdomínio**: campo `subdomain` é `@unique` no banco

### 6.4 Fluxo de Isolamento (exemplo)
```
1. super_admin cria nova Unit "Videira" (subdomain: videira)
2. super_admin cria AuthUser admin_unit vinculado a unitId=videira
3. Admin Videira faz login → JWT contém unitId=videira
4. Admin Videira cria empresa → POST /companies { unitId: "videira", ... }
5. Admin Videira lista beneficiários → GET /users?unitId=videira
6. Admin de outra unit jamais vê dados de Videira
```

---

## 7. PROBLEMAS CRÍTICOS DE SEGURANÇA

| # | Problema | Onde | Severidade | Ação Necessária |
|---|----------|------|------------|-----------------|
| 1 | `GET /stats/global` sem auth de role | `stats.controller.ts` | 🔴 CRÍTICO | Adicionar guard `super_admin` |
| 2 | `GET /units` sem auth de role | `units.controller.ts` | 🔴 CRÍTICO | Adicionar guard `super_admin` |
| 3 | `POST /auth/admin-users` sem validação de role | `auth.controller.ts` | 🔴 CRÍTICO | Validar que req.user.role === 'super_admin' |
| 4 | CPF `@unique` global (sem unitId) | `schema.prisma` User | 🔴 CRÍTICO | Mudar para `@@unique([cpf, unitId])` |

---

## 8. TODOS OS ENDPOINTS DA API

### Auth (`/auth`)
| Método | Endpoint | Auth | O que faz |
|--------|----------|------|-----------|
| POST | `/auth/login` | ❌ Público | Login, cria sessão JWT |
| POST | `/auth/logout` | ✅ JWT | Deleta sessão |
| GET | `/auth/me` | ✅ JWT | Retorna user autenticado |
| GET | `/auth/admin-users` | ✅ JWT | Lista usuários admin |
| POST | `/auth/admin-users` | ✅ JWT | Cria usuário admin |
| PATCH | `/auth/admin-users/:id/status` | ✅ JWT | Ativa/inativa admin |

### Users (`/users`)
| Método | Endpoint | Auth | O que faz |
|--------|----------|------|-----------|
| GET | `/users` | ✅ JWT | Lista com filtros (unitId, companyId, search, type) |
| GET | `/users/:id` | ✅ JWT | Detalhes + dependentes + transações |
| POST | `/users` | ✅ JWT | Cria beneficiário |
| PUT | `/users/:id` | ✅ JWT | Atualiza beneficiário |
| PATCH | `/users/:id/status` | ✅ JWT | Ativa/inativa |
| DELETE | `/users/:id` | ✅ JWT | Soft delete (inativa) |
| GET | `/users/validate/:cpf` | ✅ JWT | Valida CPF em uma unidade |
| POST | `/users/import` | ✅ JWT | Importa lote via array |

### Companies (`/companies`)
| Método | Endpoint | Auth | O que faz |
|--------|----------|------|-----------|
| GET | `/companies` | ✅ JWT | Lista com filtros |
| GET | `/companies/:id` | ✅ JWT | Detalhes da empresa |
| GET | `/companies/stats` | ✅ JWT | Stats de uma unidade |
| POST | `/companies` | ✅ JWT | Cria empresa |
| PUT | `/companies/:id` | ✅ JWT | Atualiza |
| PATCH | `/companies/:id/status` | ✅ JWT | Ativa/inativa |
| DELETE | `/companies/:id` | ✅ JWT | Soft delete |

### Providers (`/providers`)
| Método | Endpoint | Auth | O que faz |
|--------|----------|------|-----------|
| GET | `/providers` | ✅ JWT | Lista com filtros |
| GET | `/providers/:id` | ✅ JWT | Detalhes |
| GET | `/providers/ranking` | ✅ JWT | Top credenciados por score |
| POST | `/providers` | ✅ JWT | Cria credenciado |
| PUT | `/providers/:id` | ✅ JWT | Atualiza |
| PATCH | `/providers/:id/status` | ✅ JWT | Ativa/inativa |
| DELETE | `/providers/:id` | ✅ JWT | Soft delete |
| GET | `/providers/:id/services` | ✅ JWT | Lista serviços do credenciado |
| POST | `/providers/:id/services` | ✅ JWT | Adiciona serviço |

### Units (`/units`)
| Método | Endpoint | Auth | O que faz |
|--------|----------|------|-----------|
| GET | `/units` | ✅ JWT | Lista todas as unidades |
| GET | `/units/:id` | ✅ JWT | Detalhes de uma unidade |
| POST | `/units` | ✅ JWT | Cria nova unidade |
| PUT | `/units/:id` | ✅ JWT | Atualiza unidade |
| DELETE | `/units/:id` | ✅ JWT | Inativa unidade |

### Stats (`/stats`)
| Método | Endpoint | Auth | O que faz |
|--------|----------|------|-----------|
| GET | `/stats/dashboard` | ✅ JWT | Stats de uma unidade específica |
| GET | `/stats/global` | ✅ JWT | Stats globais (todas as unidades) |
| GET | `/stats/company` | ✅ JWT | Stats de uma empresa |

---

## 9. PROGRESSO POR MÓDULO

```
Portal Admin — Dashboard:       ████████░░  80%  (datepicker sem filtro real)
Portal Admin — Beneficiários:   █████████░  90%  (histórico + carteirinha sem ação)
Portal Admin — Empresas:        ████████░░  80%  (importar + exportar sem ação)
Portal Admin — Credenciados:    █████████░  90%  (CRUD completo)
Portal Admin — Unidades:        ████████░░  80%  (white label sem ação)
Portal Admin — Admin Users:     ████████░░  80%  (editar sem ação)
Portal Admin — Prêmios:         ████░░░░░░  40%  (UI mockada, botões sem ação)
Portal Admin — Faturamento:     ░░░░░░░░░░   0%  (placeholder Sprint 8)
Portal Admin — Relatórios:      ░░░░░░░░░░   0%  (placeholder Sprint 9)
Portal Admin — Configurações:   ███░░░░░░░  30%  (UI sem backend)

Portal RH — Dashboard:          ██████████ 100%  (dados reais)
Portal RH — Colaboradores:      ██████████ 100%  (CRUD completo)
Portal RH — Dependentes:        ███████░░░  70%  (view-only, sem cadastro)
Portal RH — Importar:           ██████████ 100%  (CSV funcional)
Portal RH — Relatórios:         ███████░░░  70%  (métricas básicas)

Portal Credenciado — Home:      ███░░░░░░░  30%  (UI mockada, sem API)
Portal Credenciado — Serviços:  ░░░░░░░░░░   0%  (não implementado)
Portal Credenciado — Histórico: ░░░░░░░░░░   0%  (não implementado)
Portal Credenciado — Gamif.:    ░░░░░░░░░░   0%  (não implementado)

Portal Paciente — Carteirinha:  ██░░░░░░░░  20%  (dados hardcoded)
Portal Paciente — Dependentes:  ░░░░░░░░░░   0%  (página vazia)
Portal Paciente — Guia Médico:  ░░░░░░░░░░   0%  (página vazia)
Portal Paciente — Histórico:    ░░░░░░░░░░   0%  (página vazia)
Portal Paciente — Prêmios:      ░░░░░░░░░░   0%  (página vazia)
```

---

## 10. ROADMAP DE CORREÇÕES (PRIORIDADE)

### 🔴 URGENTE — Segurança (fazer antes de usar em produção real)

- [ ] **S1** — `GET /stats/global`: adicionar guard para `super_admin` only
- [ ] **S2** — `GET /units`: adicionar guard para `super_admin` only
- [ ] **S3** — `POST /auth/admin-users`: validar que `req.user.role === 'super_admin'`
- [ ] **S4** — `User.cpf @unique`: mudar para `@@unique([cpf, unitId])` + migration

### 🟠 SPRINT 6 — Portal Credenciado (atendimento real)

- [ ] **C1** — Conectar busca de CPF ao `GET /users/validate/:cpf`
- [ ] **C2** — Carregar serviços do credenciado via `GET /providers/:id/services`
- [ ] **C3** — Registrar atendimento via `POST /transactions` (criar endpoint)
- [ ] **C4** — `/portal-credenciado/servicos` — gerenciar serviços com preços
- [ ] **C5** — `/portal-credenciado/historico` — histórico de atendimentos do credenciado

### 🟠 SPRINT 7 — Portal Paciente (carteirinha real)

- [ ] **P1** — Carteirinha com dados reais (nome, CPF, plano, QR code)
- [ ] **P2** — `/portal-paciente/dependentes` — listar dependentes do titular
- [ ] **P3** — `/portal-paciente/guia` — buscar credenciados por categoria/região
- [ ] **P4** — `/portal-paciente/historico` — histórico de transações do paciente

### 🟡 SPRINT 8 — Faturamento SaaS

- [ ] **F1** — Definir modelo de cobrança (por vidas? por unidade? mensalidade fixa?)
- [ ] **F2** — Criar modelo `Invoice` no schema
- [ ] **F3** — Dashboard de receita por unidade para super_admin

### 🟡 SPRINT 9 — Relatórios

- [ ] **R1** — Relatório de atendimentos por período (PDF/Excel)
- [ ] **R2** — Log de alterações (quem criou/editou o quê)
- [ ] **R3** — Relatório de utilização por empresa

### 🟢 MELHORIAS CONTÍNUAS (qualquer sprint)

- [ ] **M1** — Botão editar em admin-users
- [ ] **M2** — White label salvar no banco (`Unit.settings`)
- [ ] **M3** — Configurações salvar dados reais
- [ ] **M4** — Ícones histórico/carteirinha em beneficiários
- [ ] **M5** — Exportar lista de empresas/beneficiários
- [ ] **M6** — Prêmios/Gamificação conectar endpoints de Reward
- [ ] **M7** — Filtro de período no gráfico do dashboard

---

## 11. SCHEMA DO BANCO (resumo)

```prisma
Unit         { id, name, subdomain @unique, settings?, status, createdAt }
Company      { id, unitId, corporateName, cnpj @unique, adminEmail, status }
User         { id, unitId, companyId?, fullName, cpf @unique*, type, parentId?, pointsBalance, status }
Provider     { id, unitId, name, category, address?, rankingScore, bio?, status }
Service      { id, providerId, description, originalPrice, discountedPrice }
Transaction  { id, userId, providerId, serviceId, amountSaved, confirmedByUser, rating? }
Reward       { id, providerId, name, pointsRequired, stock }
AuthUser     { id, email @unique, passwordHash, role, unitId?, companyId?, providerId?, userId?, status }
Session      { id, authUserId, token @unique, expiresAt }

* CPF precisa virar @@unique([cpf, unitId]) — ver item S4
```

---

**Documento gerado em**: 23/03/2026
**Arquivos analisados**: 50+
**Endpoints documentados**: 28
**Páginas mapeadas**: 40+
**Próxima revisão**: após Sprint 6
