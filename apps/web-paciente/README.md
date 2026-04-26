# ACIAV Saúde — App do Paciente (PWA)

PWA dedicado para o paciente apresentar a carteirinha digital nos credenciados, ver histórico de uso, dependentes, guia de credenciados e configurações.

Estrutura preparada para virar APK (Android) e IPA (iOS) via Capacitor sem refactor.

## Rodar localmente

Pré-requisitos: api-core rodando (porta 3000 por padrão) com DATABASE_URL e JWT_SECRET configurados.

```bash
# Da raiz do monorepo:
npm install                                    # 1 vez
npx prisma generate --schema packages/database/prisma/schema.prisma  # 1 vez (se mudou schema)

# Terminal 1 — API
cd apps/api-core && npm run start:dev

# Terminal 2 — Painel admin (admin, RH, credenciado) — porta 3000
cd apps/web-admin && npm run dev

# Terminal 3 — App do paciente (PWA) — porta 3002
cd apps/web-paciente && npm run dev
```

Abrir `http://localhost:3002` → redireciona para `/login`.

> Em dev, o service worker fica desabilitado (`disable: process.env.NODE_ENV === 'development'`). Para testar PWA real, rodar `npm run build && npm run start`.

## Variáveis de ambiente

`.env.local` em `apps/web-paciente/`:

```
NEXT_PUBLIC_API_URL=https://api.aciavsaude.com.br
API_URL=http://localhost:3000
```

`.env.local` em `apps/web-admin/`:

```
NEXT_PUBLIC_PACIENTE_URL=http://localhost:3002
```

## Login

- **Padrão**: CPF (com máscara `999.999.999-99`)
- **Alternativo**: e-mail
- Backend `auth.service.ts:login()` aceita ambos — se identificador não tem `@`, faz fallback via `User.cpf` → `AuthUser.userId`.

## PWA

- Manifest dinâmico em `/manifest.webmanifest` (gerado por `app/manifest.ts`)
- Service worker em `/sw.js` (gerado por `@ducanh2912/next-pwa`)
- Ícones em `public/icons/` (15 PNGs: 72→1024, 4 Apple, 2 maskable)
- Splash screens iOS em `public/splash/` (6 PNGs por dispositivo)
- Botão "Instalar" aparece no portal quando navegador suporta `beforeinstallprompt`
- Em iOS Safari, mostra balão "Compartilhar > Adicionar à Tela de Início"

## Estrutura

```
apps/web-paciente/
├── app/
│   ├── (public)/             # rotas sem auth
│   │   ├── login/
│   │   ├── esqueci-senha/
│   │   └── redefinir-senha/
│   ├── (auth)/               # rotas autenticadas (role=patient)
│   │   ├── layout.tsx        # sidebar + header + InstallPrompt + OfflineBanner
│   │   └── portal/
│   │       ├── page.tsx                # cartão digital
│   │       ├── bem-vindo/              # wizard primeiro acesso
│   │       ├── historico/              # transações
│   │       ├── dependentes/            # dependentes do plano
│   │       ├── guia/                   # busca de credenciados
│   │       ├── configuracoes/          # perfil, senha, notificações, LGPD
│   │       └── premios/                # placeholder
│   ├── api/auth/{login,forgot-password,reset-validate,reset-confirm}/
│   ├── internal/
│   │   ├── set-cookie/
│   │   ├── logout/
│   │   ├── api/[...slug]/             # proxy autenticado para api-core
│   │   └── download/[...slug]/        # proxy de downloads (XLSX, etc)
│   ├── layout.tsx                     # raiz com viewport + Apple splash
│   ├── manifest.ts                    # PWA manifest dinâmico
│   ├── globals.css                    # Tailwind 4 + safe-area helpers
│   └── page.tsx                       # redirect / → /portal ou /login
├── components/
│   ├── SidebarPaciente.tsx
│   ├── InstallPrompt.tsx              # Android prompt + iOS hint
│   ├── OfflineBanner.tsx
│   ├── QrCodeImage.tsx
│   ├── Modal.tsx
│   └── ConfirmDeleteDialog.tsx
├── lib/
│   ├── server-api.ts                  # serverFetch + getSessionUser
│   └── api-client.ts                  # api.{get,post,put,patch,delete}
├── middleware.ts                      # auth + role guard
├── next.config.js                     # next-pwa wrap
├── public/
│   ├── icons/
│   ├── splash/
│   └── svg/                           # fontes SVG (icon, horizontal, vertical)
└── scripts/
    └── generate-pwa-assets.mjs        # regenera ícones/splashes a partir dos SVGs
```

## Regenerar ícones e splashes

Quando o logo mudar, atualizar os SVGs em `public/svg/` e rodar:

```bash
cd apps/web-paciente
node scripts/generate-pwa-assets.mjs
```

Isso regenera todos os 15 ícones, 6 splashes Apple, 3 favicons e a logo horizontal.

## Roadmap para virar app

Quando for empacotar como Android/iOS:

```bash
cd apps/web-paciente
npm install -D @capacitor/core @capacitor/cli @capacitor/preferences @capacitor/push-notifications @capacitor/camera @capacitor/status-bar
npx cap init "ACIAV Saúde" "br.com.aciavsaude.app" --web-dir=out
# Configurar capacitor.config.ts: server: { url: 'https://app.aciavsaude.com.br' }
npx cap add android   # gera apps/web-paciente/android/
npx cap add ios       # gera apps/web-paciente/ios/ (precisa Mac + Xcode)
npx cap sync
npx cap open android  # abre no Android Studio para gerar APK
```

Para Apple App Store: precisa conta Apple Developer ($99/ano) + Xcode.
Para Google Play: conta Google Play Developer ($25 uma vez).

## Verificar PWA antes de publicar

```bash
npm run build && npm run start
# Em outro terminal:
npx lighthouse http://localhost:3002 --view --preset=desktop
```

Meta: ≥90 em PWA, Accessibility, Best Practices.
