# PRD — Perfis, Permissões e Experiências por Papel
**Projeto:** ACIAV Saúde — SaaS Multi-tenant de Convênios de Saúde
**Versão:** 1.0 | **Data:** 2026-03-23
**Status:** Referência definitiva para desenvolvimento

---

## Visão Geral do Sistema

O ACIAV Saúde é uma plataforma SaaS multi-tenant que conecta:
- **Associações/Unidades** (ex: ACIAV Videira, ACIC Caçador) → contratam o SaaS
- **Empresas** (ex: Karikal, Videira Implementos) → vinculadas a uma unidade
- **Beneficiários/Pacientes** → colaboradores das empresas e seus dependentes
- **Credenciados** → clínicas, médicos, farmácias, laboratórios parceiros da unidade
- **RH** → gestor da empresa responsável por cadastrar e gerir colaboradores

O SaaS é vendido para associações comerciais (ACIs) que implantam o sistema como benefício de saúde para as empresas associadas.

---

## Modelo de Isolamento Multi-tenant

```
SaaS (Super Admin)
  └── Unidade A: ACIAV Videira  (unitId: xxx)
        ├── Empresas da Unidade A
        ├── Beneficiários da Unidade A
        └── Credenciados da Unidade A
  └── Unidade B: ACIC Caçador   (unitId: yyy)
        ├── Empresas da Unidade B
        ├── Beneficiários da Unidade B
        └── Credenciados da Unidade B
```

**Regra absoluta:** Nenhum dado de uma unidade é visível para usuários de outra unidade. O `unitId` é filtro obrigatório em todas as queries de `admin_unit`, `rh`, `provider` e `patient`.

---

## Perfis e Permissões

### 1. Super Admin (`super_admin`)

**Quem é:** Proprietário/equipe do SaaS ACIAV Saúde.
**Isolamento:** Acesso global — vê e gerencia TODAS as unidades.

#### Dashboard
- Cards globais: total de unidades ativas, total de vidas (todas as unidades), total de empresas, receita mensal SaaS
- Gráfico: crescimento de pacientes por unidade nos últimos 6 meses
- Lista de unidades com status, vidas, receita

#### Menu / Páginas
| Página | Permissões |
|--------|-----------|
| `/` Dashboard Global | Visualizar métricas de todas as unidades |
| `/unidades` | Criar, editar, ativar/inativar unidades |
| `/unidades/:id` | Ver detalhes, entrar como Admin da unidade |
| `/faturamento` | Ver planos, cobranças por unidade, valor/paciente |
| `/admin-users` | Criar e gerenciar contas de `admin_unit` |
| `/configuracoes` | Configurações globais do SaaS |

#### Regras de Negócio
- Único perfil que pode criar novas unidades
- Único perfil que pode criar contas `admin_unit`
- Pode "impersonar" qualquer unidade para suporte
- Define modelo de cobrança: implantação + mensalidade OU valor por paciente ativo

---

### 2. Admin Unidade (`admin_unit`)

**Quem é:** Gestor da unidade (ex: equipe da ACIAV Videira).
**Isolamento:** Vê apenas dados do seu `unitId`. Não sabe quantas unidades existem no SaaS.

#### Dashboard
- Cards da sua unidade: total de vidas ativas, empresas ativas, credenciados, economia gerada
- Gráfico: atendimentos e economia dos últimos 6 meses
- Top 5 credenciados por ranking

#### Menu / Páginas
| Página | Permissões |
|--------|-----------|
| `/` Dashboard | Métricas da sua unidade |
| `/beneficiarios` | Criar, editar, transferir entre empresas, inativar, excluir |
| `/credenciados` | Criar, editar, ativar/inativar, excluir, ver logs de alterações |
| `/empresas` | Criar, editar, ativar/inativar |
| `/empresas/:id/rh-users` | Criar contas `rh` vinculadas à empresa |
| `/credenciados/:id/account` | Criar conta `provider` para o credenciado |
| `/relatorios` | Relatórios completos: atendimentos, economia, logs de alterações |
| `/configuracoes` | White label, cores, logotipo da unidade |

#### Regras de Negócio
- **Não vê** a página `/unidades` (não sabe de outras unidades)
- Pode transferir beneficiário inativo da Empresa X para Empresa Y (mesmo `unitId`)
- Pode excluir beneficiários (diferente do RH que só inativa)
- Pode ver logs de todas as alterações feitas por credenciados nos preços/serviços
- Cria contas `rh` vinculadas às empresas da sua unidade
- Cria contas `provider` vinculadas aos credenciados da sua unidade

---

### 3. RH (`rh`)

**Quem é:** Responsável de RH de uma empresa específica.
**Isolamento:** Vê apenas beneficiários vinculados ao seu `companyId`.

#### Dashboard / Home
- Cards: total de colaboradores ativos, total de dependentes, uso médio no mês
- Lista de novos cadastros pendentes de aprovação

#### Menu / Páginas
| Página | Permissões |
|--------|-----------|
| `/portal-rh` | Dashboard com métricas da empresa |
| `/portal-rh/colaboradores` | Listar, cadastrar, aprovar, inativar beneficiários da empresa |
| `/portal-rh/dependentes` | Listar, aprovar, inativar dependentes dos colaboradores |
| `/portal-rh/importar` | Importar planilha de colaboradores (modelo padrão do sistema) |
| `/portal-rh/relatorios` | Relatório de uso, atendimentos, economia da empresa |

#### Regras de Negócio
- **Pode:** criar, aprovar, inativar, bloquear beneficiários e dependentes
- **Não pode:** excluir (apenas admin_unit pode excluir)
- **Não pode:** transferir beneficiário entre empresas (apenas admin_unit)
- Importação via planilha: o sistema fornece template Excel/CSV com colunas obrigatórias (nome, CPF, cargo, e-mail)
- Ao importar, o sistema valida CPFs únicos, trata duplicatas, e cria os beneficiários em lote

---

### 4. Credenciado (`provider`)

**Quem é:** Clínica, médico, farmácia ou estabelecimento parceiro da unidade.
**Isolamento:** Vê apenas transações e dados do seu `providerId`.

#### Dashboard / Home
- Cards: atendimentos do mês, economia gerada, total de serviços cadastrados
- Histórico de atendimentos recentes (últimos 10)
- Aviso: "Ranking — Funcionalidade disponível em breve"

#### Menu / Páginas
| Página | Permissões |
|--------|-----------|
| `/portal-credenciado` | Dashboard com métricas do credenciado |
| `/portal-credenciado/servicos` | Cadastrar e editar serviços/preços (com log automático) |
| `/portal-credenciado/historico` | Histórico de atendimentos realizados |
| `/portal-credenciado/atendimento` | Tela de registro de atendimento (CPF / QR Code) |

#### Regras de Negócio
- **Pode:** cadastrar e editar seus serviços e preços
- **Todo edit de serviço/preço gera log** (campo, valor anterior, novo valor, data, usuário) — visível apenas para admin_unit
- **Não vê** ranking (mensagem: "Em breve")
- **Emite** código de atendimento via QR Code para o beneficiário confirmar
- Registro de atendimento: busca beneficiário por CPF, exibe carteirinha digital, registra uso

---

### 5. Paciente/Beneficiário (`patient`)

**Quem é:** Colaborador ou dependente cadastrado na unidade.
**Isolamento:** Vê apenas seus próprios dados e transações.

#### Dashboard / Home
- Saldo de pontos
- Último atendimento realizado
- Atalhos: Guia de credenciados, Histórico, Carteirinha

#### Menu / Páginas
| Página | Permissões |
|--------|-----------|
| `/portal-paciente` | Dashboard pessoal |
| `/portal-paciente/guia` | Guia de credenciados da unidade (busca por categoria, nome) |
| `/portal-paciente/historico` | Histórico de atendimentos pessoais |
| `/portal-paciente/dependentes` | **Visualizar** dependentes (não pode criar/editar/excluir) |
| `/portal-paciente/carteirinha` | Carteirinha digital com QR Code e CPF |
| `/portal-paciente/premios` | Catálogo de recompensas por pontos |
| `/portal-paciente/configuracoes` | Alterar senha |

#### Formas de Uso no Atendimento
1. **CPF** — informa o CPF no credenciado, que busca no sistema
2. **QR Code** — carteirinha digital gera QR Code dinâmico com dados do beneficiário
3. **Carteirinha Digital** — exibe dados do plano, empresa, validade

#### Regras de Negócio
- **Pode:** visualizar dependentes, histórico, guia, carteirinha
- **Não pode:** criar, editar ou excluir dependentes (apenas visualizar)
- **Não pode:** ver dados de outros pacientes

---

## Fluxo de Criação de Contas (Hierarquia)

```
Super Admin
  → cria Admin Unidade (vincula ao unitId)
      → cria conta RH (vincula ao companyId dentro do unitId)
      → cria conta Provider (vincula ao providerId dentro do unitId)
          → RH cria/importa Beneficiários (vincula ao companyId)
              → Beneficiários têm Dependentes
```

---

## Fluxo de Atendimento

```
1. Beneficiário apresenta CPF / QR Code / Carteirinha no credenciado
2. Credenciado busca o beneficiário pelo CPF no portal
3. Sistema valida: beneficiário ativo? empresa ativa? unidade ativa?
4. Credenciado seleciona o serviço prestado
5. Sistema registra a Transaction (userId, providerId, serviceId, amountSaved)
6. Sistema gera QR Code de confirmação para o beneficiário
7. Beneficiário confirma o atendimento (confirmedByUser = true)
8. Pontos são creditados ao beneficiário
9. Log fica disponível para admin_unit nos relatórios
```

---

## Modelo de Cobrança SaaS (Super Admin)

| Modelo | Descrição |
|--------|-----------|
| Implantação | Taxa única por unidade implantada |
| Mensalidade Fixa | Valor mensal por unidade independente do volume |
| Por Paciente Ativo | Valor mensal × número de beneficiários ativos no mês |
| Híbrido | Mensalidade base + valor por paciente acima de um tier |

O Super Admin acompanha no painel de Faturamento: unidades ativas, pacientes ativos/unidade, fatura do mês, histórico de pagamentos.

---

## Separação de Telas por Perfil

| Perfil | Layout | Rota Base |
|--------|--------|-----------|
| super_admin | AdminLayout (sidebar global) | `/` |
| admin_unit | AdminLayout (sidebar da unidade) | `/` |
| rh | RHLayout (sidebar RH) | `/portal-rh` |
| provider | CredenciadoLayout | `/portal-credenciado` |
| patient | PacienteLayout (mobile-first) | `/portal-paciente` |

### Diferenças de Sidebar: super_admin vs admin_unit

| Item de Menu | super_admin | admin_unit |
|--------------|-------------|------------|
| Dashboard Global | ✅ | ❌ |
| Dashboard da Unidade | ❌ (vê global) | ✅ |
| Unidades | ✅ | ❌ |
| Faturamento | ✅ | ❌ |
| Admin Users | ✅ | ❌ (só cria RH e Provider) |
| Beneficiários | ✅ (qualquer unidade) | ✅ (só a sua) |
| Credenciados | ✅ (qualquer unidade) | ✅ (só os seus) |
| Empresas | ✅ (qualquer unidade) | ✅ (só as suas) |
| Relatórios | ✅ global | ✅ da unidade |
| Configurações | ✅ global SaaS | ✅ white label da unidade |

---

## Próximos Sprints Prioritários

### Sprint 4 — Separação de UI por Perfil
- [ ] Dashboard Super Admin (visão global)
- [ ] Dashboard Admin Unidade (visão da unidade — já existe, ajustar sidebar)
- [ ] Sidebar dinâmico por role
- [ ] Página de gestão de usuários admin (criar admin_unit, rh, provider)

### Sprint 5 — Portal RH
- [ ] Dashboard RH com métricas da empresa
- [ ] Gestão de colaboradores e dependentes
- [ ] Importação de planilha (template + validação)

### Sprint 6 — Portal Credenciado
- [ ] Dashboard com atendimentos do mês
- [ ] Cadastro de serviços com log de alterações
- [ ] Tela de atendimento (busca por CPF + QR Code)
- [ ] Emissão de QR Code de confirmação

### Sprint 7 — Portal Paciente (Mobile-first)
- [ ] Carteirinha digital com QR Code
- [ ] Guia de credenciados com busca e filtros
- [ ] Histórico de atendimentos
- [ ] Visualização de dependentes
- [ ] Catálogo de prêmios

### Sprint 8 — Faturamento SaaS
- [ ] Painel de faturamento do Super Admin
- [ ] Cálculo automático por paciente ativo/mês
- [ ] Histórico de faturas por unidade

### Sprint 9 — Relatórios e Logs
- [ ] Logs de alterações de preços por credenciado
- [ ] Relatório de atendimentos por empresa/período
- [ ] Exportação PDF/Excel

### Sprint 10 — App Mobile (Flutter)
- [ ] Carteirinha digital
- [ ] QR Code dinâmico
- [ ] Guia de credenciados
- [ ] Histórico de uso
- [ ] Push notifications
