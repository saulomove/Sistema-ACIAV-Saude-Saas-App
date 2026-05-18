# CLAUDE.md — Sistema ACIAV Saúde SaaS

Manual de bordo do projeto para o Claude (e para devs novos). Lê isso **antes** de mexer em qualquer fluxo crítico.

## TL;DR

SaaS de convênio de saúde (rede credenciada com descontos). Monorepo Turborepo, multi-tenant por `unitId`. 4 apps web (admin, RH, credenciado, paciente PWA) + landing + 1 API NestJS + DB PostgreSQL via Prisma.

Produção: VPS Hostinger (PM2) — domínios `aciavsaude.com.br` (landing), `admin.aciavsaude.com.br` (web-admin) e `app.aciavsaude.com.br` (web-paciente PWA).

## Estrutura do monorepo

```
apps/
  api-core/         NestJS — backend único (porta 3001 prod, 3000 dev)
  web-admin/        Next 16 — painel admin/RH/credenciado (porta 3002 prod)
  web-paciente/     Next 16 PWA — portal do beneficiário (porta 3003 prod)
  landing-page/     Next 16 — site institucional
  mobile-app/       Flutter — skeleton, NÃO está em uso (vamos com Capacitor sobre web-paciente)
  docs/             markdown solto
packages/
  database/         Prisma schema + client compartilhado
  ui/               componentes compartilhados (Tailwind 4)
  eslint-config/    config compartilhado
  typescript-config/ tsconfig bases
```

Não importa código entre `apps/*` diretamente — passe pelo `packages/*` ou pela API.

## Stack

- **Backend**: NestJS 11 + Passport JWT + Prisma 6 + PostgreSQL + bcrypt + Throttler global + Audit interceptor global.
- **Frontend**: Next.js 16 (App Router, RSC, Turbopack), Tailwind 4, lucide-react, framer-motion.
- **PWA**: `@ducanh2912/next-pwa` (Workbox). Manifest em `app/manifest.ts`. SW em `/public/sw.js`.
- **Deploy**: PM2 (3 apps), Nginx reverse proxy, Postgres na VPS, backup automatizado por módulo `backup` no NestJS.
- **Mobile (em construção)**: Capacitor sobre a PWA web-paciente. Bundle ID: `br.com.aciavsaude.paciente` para Android e iOS.

## Multi-tenancy

**Regra de ouro: TODA query que toca dado de usuário/credenciado/transação precisa filtrar por `unitId`.** Single-tenant em produção hoje (1 unit), mas o código é multi-tenant.

- `super_admin` pode passar `unitId` em query string; demais roles ignoram e usam `req.user.unitId`.
- Pattern padrão (visto em `providers.controller.ts`):
  ```ts
  const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
  if (!effectiveUnitId && req.user.role !== 'super_admin') {
    throw new ForbiddenException('Tenant não identificado.');
  }
  ```
- Esquecer filtro `unitId` em endpoints **vaza dado entre tenants**. Tratar como bug crítico.

## Auth

- **JWT em cookie httpOnly** (`aciav_token`) emitido por `apps/api-core/src/auth/auth.service.ts`.
- **`Session` table** no Prisma — cada login cria uma row, JwtStrategy valida sessão a cada request. Apagar a row invalida o JWT na hora (não precisa esperar expirar).
- **Roles**: `super_admin` | `admin_unit` | `rh` | `provider` | `patient`. Middleware no `web-admin` redireciona baseado em role.
- **Login identifier**: hoje é **CPF** (paciente) ou **email** (demais). Apple App Store aceita CPF como "Government ID" se declarado nas privacy labels.
- **Brute-force**: módulo `auth` faz lockout após N tentativas (configurável por unit em `unit.settings`).
- **Reset de senha**: token `PasswordResetToken` com TTL.

**IMPORTANTE**: para o app mobile (Capacitor iOS), cookies httpOnly NÃO funcionam cross-origin. Vai precisar migrar pra Bearer header + `@capacitor/preferences` (Keychain/EncryptedSharedPrefs). Quando isso for feito, **manter retrocompatibilidade pra a PWA web atual**.

## Domínio (modelos Prisma principais)

Schema em `packages/database/prisma/schema.prisma`. 17 models. Principais:

- `Unit` — tenant. Tem `settings` (JSON) com policies de senha/lockout.
- `Company` — empresa cliente. Tem `inactivatedAt`, `inactivationLockUntil`, `cardTypeOverride`.
- `User` — beneficiário (titular ou dependente). `cpf` único por `[cpf, unitId]`. Tem `status`, `inactivatedAt`, `inactivationReason`.
- `AuthUser` — credencial de login. `email` único global. Tem `userId` (link pra `User` se for paciente), `providerId` (se for credenciado), `companyId` (se for RH).
- `Session` — JWT ativo. Apagar = invalidar token.
- `Provider` — credenciado. Tem `professionalName` (médico individual) ou `clinicName` (PJ). `entityType` é derivado em runtime (8 tipos).
- `Service` — preço/desconto do credenciado. Tem 3 modos: `fixed`, `percentFixed`, `percentRange`.
- `Transaction` — atendimento registrado. Sensível, **retido por obrigação legal** mesmo após exclusão de conta.
- `Reward` — prêmio (catálogo placeholder hoje).
- `AuditLog` — toda ação sensível passa pelo `AuditService.log()`.

## Fluxos críticos (CUIDADO)

### 1. Cadastro de beneficiário
- `POST /users` — cria `User` + auto-cria `AuthUser` com CPF como login e CPF como senha (precisa trocar no primeiro acesso).
- Importação XLSX em `POST /users/import` (rate-limited 3 req/60s, só `super_admin` e `admin_unit`).
- **Conflito de CPF**: se já existe `User` com o mesmo CPF em outra unit, backend retorna **HTTP 409** com flag pra transferência. UI precisa pedir `confirmTransfer=true`.

### 2. Login do paciente
- Identifier: **CPF**, senha hash bcrypt. AuthUser desativado (`status=false`) bloqueia login.
- 1º acesso obrigatório: `firstAccessDone` no `User` controla o wizard `/portal/bem-vindo`.

### 3. Carteirinha digital
- Em `apps/web-paciente/app/(auth)/portal/page.tsx`.
- **Hoje sem QR Code** (removido — credenciado não tem leitor ainda).
- Mostra: foto, nome, CPF mascarado, empresa, pontos.

### 4. Account deletion (LGPD + Apple 5.1.1(v))
- `DELETE /portal-paciente/me?reason=...` com motivo mínimo 5 chars.
- Faz **soft-delete imediato**: `User.status=false`, `AuthUser.status=false`, **apaga todas as `Session`** do AuthUser.
- Mantém dados de `Transaction` por obrigação legal (LGPD Art. 16 II).
- Audit log com action `account_deletion`.
- UI em `apps/web-paciente/app/(auth)/portal/configuracoes/page.tsx` aba "Privacidade (LGPD)" — após sucesso, redireciona pra `/login`.
- **NÃO** transformar isso em "request only" sem desativar — Apple reprova.

### 5. Histórico de atendimentos
- `apps/web-paciente/app/(auth)/portal/historico/page.tsx` — hoje carrega tudo sem paginação. Conhecida fragilidade.

### 6. Guia médico (filtros)
- Backend: `apps/api-core/src/providers/providers.service.ts` `findAll()` carrega tudo em memória e ordena com `professionals first`.
- Front: `apps/web-paciente/app/(auth)/portal/guia/GuiaClient.tsx` — multi-select de tipo lê URL como source-of-truth (não React state) pra evitar staleness entre cliques.
- Limite atual cabe em memória; quando passar de ~5k providers, refatorar pra raw SQL.

### 7. Pagamento / Transação
- `Transaction` é criada por credenciado ou admin via `POST /transactions`. Sensível — **nunca mexer no fluxo sem alinhar com Saulo**.
- Tem `confirm` (`PATCH /transactions/:id/confirm`) e `rating` (`PATCH /transactions/:id/rating`).

### 8. Backup
- Módulo `backup` no NestJS faz dump da DB. Endpoint protegido. Não deletar sem entender o cron.

## Convenções

- **Idioma**: UI em **pt-BR**; logs, comentários técnicos e nomes de variáveis em **en-US**.
- **Validação no front**: **inline, sem lib** (web-admin não usa zod/yup/react-hook-form). Web-paciente segue mesmo padrão.
- **Erros**: `BadRequestException` com mensagem em pt-BR pro usuário (`'Informe o motivo...'`). Códigos HTTP semanticamente corretos.
- **Audit**: ações que mexem em dado sensível (criar/editar/desativar usuário, criar transação, exclusão de conta) **devem** chamar `AuditService.log()`.
- **Throttle**: endpoints sensíveis (`/auth/login`, `/users/import`, `DELETE /portal-paciente/me`) decorados com `@Throttle({ default: { ttl, limit } })`.

## Deploy (VPS Hostinger)

3 processos PM2:
- `aciav-api` (id 0) — porta 3001
- `aciav-web` (id 1) — porta 3002 (web-admin)
- `aciav-paciente` (id 2) — porta 3003 (web-paciente PWA)

Nginx faz reverse proxy. Uploads de fotos em `/var/www/aciav-saude/apps/api-core/uploads/providers/` servidos via Nginx em `/uploads/`.

Web-paciente roda com `next start --webpack` (não Turbopack) por causa de incompatibilidade com `next-pwa`. Ver `apps/web-paciente/next.config.js`.

**Deploy padrão:**
```bash
cd /var/www/aciav-saude
git pull origin main
# Backend
cd apps/api-core && npx nest build && pm2 restart aciav-api --update-env
# Frontend admin
cd ../web-admin && npx next build && pm2 restart aciav-web --update-env
# Frontend paciente (Turbopack incompatível com next-pwa)
cd ../web-paciente && npx next build --webpack && pm2 restart aciav-paciente --update-env
# Migrations (quando houver)
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
```

## Bugs/limitações conhecidos

- **Histórico do paciente sem paginação** (`/portal/historico`). Carrega tudo.
- **Prêmios é stub** — UI existe, catálogo nunca foi populado.
- **Endereço de credenciado em JSON-string** dentro de campo text — parsing pode falhar silenciosamente.
- **Click tracking fire-and-forget** com keepalive — perde dado se request cair.
- **Hardcoded JWT secret em `apps/mobile-app/lib/screens/digital_card_screen.dart`** — Flutter app não está em uso, mas remover antes de qualquer reutilização.

## Antes de pushar

- `pnpm run check-types` (turbo) ou `npx tsc --noEmit` no app modificado.
- Mexeu em fluxo crítico (login, transação, account deletion, multi-tenant)? Pede review explícita do Saulo.
- Migration nova? Roda `prisma migrate dev` local, commita o `.sql`, e na VPS é `prisma migrate deploy`.
- Não pushar com `--no-verify`. Pre-commit hook precisa passar.

## Quem usa o quê

- **Saulo** — único dev. Toca tudo.
- **ACIAV** — cliente atual (single-tenant em produção). Unidades de Caçador / Iomerê / Tangará / Videira.
- **Reviews Apple/Play** quando começarem a chegar — categorizar como "Health & Fitness" (não "Medical") pra evitar review mais rigorosa.
