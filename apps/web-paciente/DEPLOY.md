# Deploy do `web-paciente` na Vercel

Guia rápido pra colocar o PWA no ar em `app.aciavsaude.com.br`.

## 1. Importar o projeto na Vercel

1. Acessar https://vercel.com/new
2. Importar o repositório do GitHub
3. **Root Directory**: selecionar `apps/web-paciente`
4. **Framework Preset**: Next.js (auto-detectado)
5. **Build & Output Settings**: deixar em branco — o `vercel.json` cuida disso
   - Build Command: definido em `vercel.json` (gera Prisma + npm run build)
   - Install Command: `cd ../.. && npm install --no-audit --no-fund`
   - Output Directory: `.next`

## 2. Variáveis de ambiente (Production + Preview + Development)

Adicionar em **Settings → Environment Variables**:

| Nome | Valor (produção) | Valor (preview/dev) |
|------|------------------|---------------------|
| `NEXT_PUBLIC_API_URL` | `https://api.aciavsaude.com.br` | mesma |
| `API_URL` | `https://api.aciavsaude.com.br` | mesma (proxy server-side) |
| `NODE_ENV` | `production` | (Vercel já seta) |

> A variável `API_URL` é usada pelos route handlers em `app/internal/api/[...slug]/route.ts` e `app/api/auth/login/route.ts`. Sem ela, o proxy aponta para `localhost:3000`.

## 3. Configurar domínio

1. **Settings → Domains**
2. Adicionar `app.aciavsaude.com.br`
3. Vercel mostra o registro DNS necessário:
   - Provavelmente `CNAME app cname.vercel-dns.com`
4. Apontar no seu provedor DNS (Cloudflare, Registro.br, etc)
5. Aguardar propagação (5–60 min)
6. HTTPS automático via Let's Encrypt

## 4. Atualizar `web-admin` para apontar para o novo domínio

Adicionar `NEXT_PUBLIC_PACIENTE_URL=https://app.aciavsaude.com.br` no projeto Vercel do `web-admin` (Settings → Environment Variables → Production).

Sem isso, quando paciente tenta logar no painel admin por engano, o redirect cai num fallback `app.aciavsaude.com.br` que pode ainda não existir.

## 5. CORS no `api-core` (em produção)

No deploy do `api-core` (PM2/Docker/etc), adicionar à env:

```
CORS_ORIGIN=https://aciavsaude.com.br,https://www.aciavsaude.com.br,https://app.aciavsaude.com.br,https://admin.aciavsaude.com.br
```

Em desenvolvimento, o fallback do `apps/api-core/src/main.ts` já inclui `localhost:3000`, `localhost:3001`, `localhost:3002` e origens Capacitor.

## 6. Verificar PWA após deploy

Abrir `https://app.aciavsaude.com.br` no Chrome desktop:
- Devtools → Application → Manifest: deve mostrar nome, ícones, splashes
- Devtools → Application → Service Workers: deve estar `activated and is running`
- Lighthouse audit: PWA score deve ser ≥90

```bash
# Local:
npx lighthouse https://app.aciavsaude.com.br --view --preset=mobile
```

## 7. Testar instalação real

| Plataforma | Como instalar |
|------------|---------------|
| Chrome Desktop | Ícone "Instalar" na barra de URL |
| Android Chrome | Menu → "Instalar app" ou prompt automático |
| iOS Safari | Compartilhar → "Adicionar à Tela de Início" |

Após instalado:
- Ícone aparece na home com a logo ACIAV
- Abre standalone (sem barra do navegador)
- Splash screen aparece no iOS (durante carregamento)
- Funciona offline para páginas já visitadas

## 8. Próximo passo: empacotar como APK/IPA

Quando quiser publicar nas lojas:

```bash
cd apps/web-paciente
npm install -D @capacitor/core @capacitor/cli @capacitor/preferences @capacitor/status-bar
npx cap init "ACIAV Saúde" "br.com.aciavsaude.app"
# Editar capacitor.config.ts:
#   server: { url: 'https://app.aciavsaude.com.br', cleartext: false }
npx cap add android
npx cap sync
npx cap open android   # abre Android Studio para gerar APK
```

Para iOS: precisa Mac + Xcode + conta Apple Developer ($99/ano).

---

## Checklist final

- [ ] Projeto importado na Vercel apontando para `apps/web-paciente`
- [ ] Env vars `NEXT_PUBLIC_API_URL` + `API_URL` configuradas
- [ ] Domínio `app.aciavsaude.com.br` configurado
- [ ] DNS apontado, HTTPS ativo
- [ ] `NEXT_PUBLIC_PACIENTE_URL` adicionada no projeto Vercel do `web-admin`
- [ ] CORS no `api-core` atualizado (`CORS_ORIGIN` env)
- [ ] Deploy bem-sucedido
- [ ] Lighthouse PWA score ≥90
- [ ] Instalação funcional em desktop, Android e iOS
