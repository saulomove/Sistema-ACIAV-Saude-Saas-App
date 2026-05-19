# Publicação Mobile — Playbook (Mac)

> Guia passo a passo pra publicar o app **ACIAV Saúde** na **Google Play Store** (Android) e **Apple App Store** (iOS), trabalhando 100% no macOS.
> Estado atual: código pronto, ícones gerados, Firebase configurado, backend deployado. Falta apenas **buildar + assinar + submeter**.

## Estimativa de tempo

| Etapa | Tempo |
|---|---|
| Instalações (Android Studio + Xcode + CLIs) | 1-2h (download pesado) |
| Geração de keystore Android | 5 min |
| Build `.aab` Android | 10 min |
| Upload pro Play Console + preenchimento de forms | 1-2h |
| Build `.ipa` iOS via Xcode | 20 min |
| Upload TestFlight + forms App Store Connect | 1-2h |
| Review (Google) | 1-3 dias |
| Review (Apple) | 24h-7 dias (pode ter rejeição na 1ª) |

**Sessão única no Mac: ~4-6h de trabalho ativo.**

---

## Pré-requisitos

### Contas (deve estar liberadas)
- ✅ Google Play Console — $25 (uma vez)
- ✅ Apple Developer Program — $99/ano
- ✅ Firebase project criado (`aciav-saude`) com Android + iOS apps já registrados

### Arquivos que você precisa ter no Mac
- ✅ Repositório git clonado
- ✅ `apps/api-core/secrets/firebase-service-account.json` (não vai pelo git — copie do PC ou do Firebase Console)
- ⚠️ APNs Key `.p8` baixada do Apple Developer (criar antes de submeter iOS)

### Configurações no Apple Developer (antes do build iOS)
1. https://developer.apple.com/account/resources/identifiers/list
2. Criar **App ID**:
   - Bundle ID: `br.com.aciavsaude.paciente`
   - Description: "ACIAV Saúde"
   - Capabilities: marcar **Push Notifications**, **Associated Domains** (opcional, deep links)
3. https://developer.apple.com/account/resources/authkeys/list
4. Criar **APNs Key**:
   - Marcar **Apple Push Notifications service (APNs)**
   - Baixar `.p8` (só pode baixar UMA vez — guarde bem)
   - Anote o **Key ID** e o **Team ID**
5. Subir essa Key no Firebase Console:
   - https://console.firebase.google.com/project/aciav-saude/settings/cloudmessaging
   - Aba **Apple app configuration** → upload `.p8` + Key ID + Team ID

### Configurações no Google Play Console (antes do build Android)
1. https://play.google.com/console
2. **Create app**:
   - App name: ACIAV Saúde
   - Default language: Português (Brasil)
   - App or game: **App**
   - Free or paid: **Free**
3. Aceite as policies (Declarations)

---

## Parte 1 — Setup do Mac (instalações)

```bash
# 1. Homebrew (caso não tenha)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Node 20+ via nvm
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 20
nvm use 20

# 3. Git + clone
git clone https://github.com/saulomove/Sistema-ACIAV-Saude-Saas-App.git
cd Sistema-ACIAV-Saude-Saas-App

# 4. Dependências
npm install

# 5. Copiar secret do Firebase pro lugar certo (do SEU PC pra esse Mac via scp, drive, ou re-download do Firebase Console)
mkdir -p apps/api-core/secrets
# Coloque o firebase-service-account.json aqui:
# scp do PC para Mac, OU re-download do Firebase Console
# (não vai pelo git por ser sensível)

# 6. Android Studio
# https://developer.android.com/studio  (download ~1GB, instalar normalmente)
# Ao abrir pela primeira vez, deixe instalar Android SDK 36 + Build Tools 36

# 7. JDK 17 (Android Studio normalmente embarca, mas garante)
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 8. Xcode (App Store, ~15GB)
# Após instalar, abrir uma vez e aceitar a licença:
sudo xcodebuild -license accept

# 9. CocoaPods
sudo gem install cocoapods

# 10. Verificações
java -version       # deve ser 17+
node -v             # deve ser 20+
pod --version       # deve mostrar versão
xcodebuild -version # deve mostrar Xcode 15+
```

---

## Parte 2 — Build Android `.aab`

### 2.1. Gerar keystore (UMA vez na vida — guarde bem!)

```bash
cd apps/web-paciente/android/app
keytool -genkey -v \
  -keystore aciav-release.keystore \
  -alias aciav \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Você vai responder umas perguntas:
- Senha do keystore (anote bem)
- Senha do alias `aciav` (pode ser igual)
- Nome, organização, cidade, estado, país (BR)

**🔐 SEGURANÇA CRÍTICA:**

- ⚠️ **Faça 3 backups**:
  1. 1Password / Bitwarden (com senhas)
  2. Drive externo encrypted
  3. Email pra si mesmo encriptado (GPG)
- ⚠️ **Se perder esse arquivo, NUNCA MAIS consegue publicar update do app.** Tem que criar um app novo na Play Store.
- ⚠️ `aciav-release.keystore` já está no `.gitignore`, não vai pro repo.

### 2.2. Configurar `key.properties`

Crie `apps/web-paciente/android/key.properties`:

```properties
storePassword=SUA_SENHA_DO_KEYSTORE
keyPassword=SUA_SENHA_DO_ALIAS
keyAlias=aciav
storeFile=aciav-release.keystore
```

Já está no `.gitignore`.

### 2.3. Adicionar signing no build.gradle

Edite `apps/web-paciente/android/app/build.gradle`:

```gradle
// No topo do arquivo, depois do `apply plugin`:
def keystorePropertiesFile = rootProject.file("app/key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "br.com.aciavsaude.paciente"
    compileSdk = rootProject.ext.compileSdkVersion

    // ADICIONAR signingConfigs ANTES de defaultConfig
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    defaultConfig { ... }

    buildTypes {
        release {
            signingConfig signingConfigs.release  // ← ADICIONAR
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2.4. Build do `.aab`

```bash
cd apps/web-paciente/android
./gradlew bundleRelease
```

Saída: `apps/web-paciente/android/app/build/outputs/bundle/release/app-release.aab`

Esse é o arquivo que sobe pra Play Console.

### 2.5. Testar local antes de subir (opcional mas recomendado)

```bash
# Build APK de teste (instala em device/emulador)
./gradlew assembleRelease
# Saída: app/build/outputs/apk/release/app-release.apk
# Instalar em um Android conectado via USB:
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## Parte 3 — Subir Android pro Play Console

1. https://play.google.com/console → seu app → **Testes internos** (Internal testing)
2. **Criar nova versão**:
   - Upload do `app-release.aab`
   - Nome da versão: `1.0.0 (1)`
   - Notas: "Lançamento inicial — gestão do convênio ACIAV Saúde."
3. Preencher as **declarações**:
   - **Política de privacidade** (URL): `https://aciavsaude.com.br/privacidade`
   - **App content**:
     - **Privacy policy** ✅
     - **App access** — fornecer login de teste pra revisor:
       - CPF: _(crie um beneficiário de demo)_
       - Senha: _(senha temporária)_
     - **Ads** — não temos: marcar "No"
     - **Content rating** — questionário IARC, será rated `Livre` (Free)
     - **Target audience and content** — 18+ (não direcionado a crianças)
     - **News app** — Não
     - **COVID-19 contact tracing** — Não
     - **Data safety** — preencher honestamente:
       - **Coleta**: nome, e-mail, CPF, telefone, foto opcional, identificadores de app, dados de uso
       - **Compartilhamento**: nenhum com terceiros para publicidade
       - **Criptografia em trânsito**: Sim
       - **Pode pedir exclusão**: Sim (in-app)
4. **Categorização**:
   - App category: **Saúde e fitness** (NÃO marcar como "Medical")
5. **Store listing**:
   - Título: "ACIAV Saúde — Convênio"
   - Descrição curta (80 chars): "Carteirinha digital e rede credenciada com descontos para beneficiários ACIAV."
   - Descrição completa (4000 chars): _(escrever 200-500 palavras destacando: rede credenciada, descontos, histórico, exportação de dados LGPD)_
   - Ícone (512×512): já gerado em `apps/web-paciente/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (mas reescale pra 512×512)
   - Feature graphic (1024×500): você precisa criar
   - Screenshots (mínimo 2, 1080×1920 ou ratio similar): rodar app no emulador e screenshotar 4-6 telas (Login, Carteirinha, Guia Médico, Histórico, Configurações)
6. **Adicionar testadores internos** (até 100 e-mails):
   - Lista de e-mails autorizados (seus + de 2-3 colegas pra testar antes)
7. **Enviar pra revisão** (Internal testing — geralmente aprovado em horas, raramente em 1-3 dias)
8. Quando aprovado, os testadores recebem link pra instalar via Play Store

Depois de validar com testadores, **promover pra Produção**:
- **Production** → criar nova release → mesmo `.aab` → preencher mais alguns campos → submit

---

## Parte 4 — Build iOS via Xcode

### 4.1. Sync e abrir o projeto

```bash
cd /caminho/Sistema-ACIAV-Saude-Saas-App/apps/web-paciente

# Atualiza projeto iOS com plugins mais recentes
npx cap sync ios

# Instala dependências CocoaPods
cd ios/App
pod install

# Abre o workspace (não o .xcodeproj!)
open App.xcworkspace
```

### 4.2. Configurar signing no Xcode

1. No painel esquerdo, selecione **App** (projeto)
2. Aba **Signing & Capabilities**
3. **Team**: selecione seu Apple Developer Team
4. **Bundle Identifier**: confirme `br.com.aciavsaude.paciente`
5. Marque ✅ **Automatically manage signing**
6. Xcode cria certificado + provisioning profile automaticamente

### 4.3. Habilitar Push Notifications

1. Ainda em **Signing & Capabilities**
2. Clique **+ Capability**
3. Adicione **Push Notifications**
4. Adicione **Background Modes** → marque **Remote notifications**

### 4.4. Adicionar Firebase SDK ao iOS

No Xcode:
1. **File → Add Package Dependencies**
2. URL: `https://github.com/firebase/firebase-ios-sdk`
3. Adicione: **FirebaseMessaging** (apenas esse, não precisa do Analytics)
4. No `AppDelegate.swift`, adicione no topo:
   ```swift
   import FirebaseCore
   import FirebaseMessaging
   ```
5. No `application(_:didFinishLaunchingWithOptions:)`, antes do `return true`:
   ```swift
   FirebaseApp.configure()
   ```

### 4.5. Build Archive

1. Selecione o destino **Any iOS Device (arm64)** (não simulador!) no topo do Xcode
2. **Product → Archive**
3. Aguarde build (5-10 min)
4. Janela **Organizer** abre — clique **Distribute App**
5. Selecione **App Store Connect** → **Upload**
6. Aceite os defaults (Include bitcode = Yes, Strip Swift symbols = Yes)
7. Selecione o **Signing & Capabilities** → **Automatically manage signing**
8. Confirme e clique **Upload**
9. Aguarde upload (5-15 min dependendo da conexão)

Quando finalizar, vai aparecer um aviso "Upload Successful". O build leva 10-30 min pra processar no App Store Connect.

---

## Parte 5 — Subir iOS pro TestFlight + App Store Review

1. https://appstoreconnect.apple.com → seu app
2. **TestFlight** tab → aguarde o build aparecer (10-30 min após upload)
3. Quando aparecer, preencha:
   - **Export Compliance**:
     - "Does your app use encryption?" → **Yes** (HTTPS)
     - "Is your app exempt from US export laws?" → **Yes** (apenas HTTPS padrão)
   - **Test Information**:
     - What to test: "Lançamento inicial — login com CPF, carteirinha digital, guia médico, histórico, configurações."
     - Feedback email: seu e-mail
4. Adicione **Internal Testers** (e-mails que estão no seu Apple Developer Team)
5. Eles recebem convite e instalam via app TestFlight no iPhone
6. **Testar** durante alguns dias

Quando estiver tudo OK, submeter pra App Store:

7. App Store Connect → **App Store** tab → **+ Version or Platform**
8. Preencher:
   - **Promotional Text** (170 chars)
   - **Description** (4000 chars)
   - **Keywords** (100 chars)
   - **Support URL**: `https://aciavsaude.com.br`
   - **Marketing URL** (opcional)
   - **Privacy Policy URL**: `https://aciavsaude.com.br/privacidade`
   - **Category**: Primary = **Health & Fitness** (não Medical!)
   - **Age Rating**: questionário, deve dar 4+ ou 12+
   - **App Privacy** → "Privacy Practices" → preencher honestamente:
     - **Data Collected**:
       - Contact Info (e-mail, phone)
       - Identifiers (User ID, CPF — declarar como "Government ID")
       - Health & Fitness (histórico de atendimentos)
       - Usage Data (cliques no guia)
       - Diagnostics (crash data)
     - **Data Linked to User**: ✅ (todos os acima são linked)
     - **Data Used for Tracking**: ❌
   - **Screenshots**: iPhone 6.7" (mínimo 3, máximo 10, 1290×2796) — pode ser exatamente as mesmas do Android
   - **App Preview** (vídeo, opcional)
9. Selecione o build do TestFlight
10. **Submit for Review**

Aguarde review (24h-7 dias). Possíveis cenários:
- ✅ **Aprovado** — vai ao ar imediatamente
- ⚠️ **Metadata rejected** — só corrigir texto/screenshot (rápido)
- ⚠️ **Binary rejected** — precisa rebuildar e re-uploar (mais lento)

Erros comuns na 1ª submissão:
- "App requires login but doesn't provide demo account" → adicione credenciais demo em App Review Information
- "Privacy policy not accessible" → garantir que `aciavsaude.com.br/privacidade` carrega
- "App is just a webview" → guideline 4.2.2 — nosso app tem push + native splash + native status bar, deve passar; se rejeitar, adicione biometric login

---

## Parte 6 — Push notifications (configuração final)

Após o app estar publicado, pra **enviar** notificações:

### Do backend (programaticamente)

```ts
// Em qualquer service que tenha PushService injetado:
await this.pushService.sendToUser(userId, {
  title: 'Novo credenciado em Caçador',
  body: 'Clínica X agora aceita ACIAV Saúde com 30% de desconto',
  data: { path: '/portal/guia' },  // navega ao tocar
});
```

### Manualmente (via Firebase Console)

1. Firebase Console → Cloud Messaging → New Campaign → Notification
2. Configura título, corpo, segmento (todos / filtros)
3. Schedule / Send Now

---

## Troubleshooting

### Android: "Your app is using deprecated API levels"
- targetSdkVersion já está em 36, não deve dar esse erro.

### iOS: "Missing Push Notification Entitlement"
- Confirme que **Push Notifications** está em Signing & Capabilities (Parte 4.3)
- Confirme que o App ID no Apple Developer tem **Push Notifications** habilitado

### Build Android falha: "SDK location not found"
- Crie `apps/web-paciente/android/local.properties` com:
  ```
  sdk.dir=/Users/SEU_USER/Library/Android/sdk
  ```

### `pod install` falha
- Atualize CocoaPods: `sudo gem install cocoapods`
- Limpe cache: `pod deintegrate && pod install`

### Build iOS falha: "Provisioning profile doesn't include the Push Notifications capability"
- No App ID (developer.apple.com), garanta Push Notifications habilitado
- No Xcode, **Signing & Capabilities**, baixe profiles novamente (botão **Try again** ou desmarca/marca "Automatically manage signing")

---

## Checklist final antes de submeter

### Android
- [ ] Keystore gerado e em 3 backups seguros
- [ ] `key.properties` configurado (gitignored)
- [ ] `signingConfigs.release` no `build.gradle`
- [ ] `.aab` buildado sem erros
- [ ] Política de privacidade publicada em URL pública
- [ ] Data safety preenchido honestamente
- [ ] Demo account criado e fornecido
- [ ] Screenshots (mínimo 2, em pasta `apps/web-paciente/store-assets/android/`)
- [ ] Feature graphic 1024×500 criado

### iOS
- [ ] App ID criado no Apple Developer com Push Notifications
- [ ] APNs Key criada e upload no Firebase Console
- [ ] Pod install rodado sem erros
- [ ] Signing configurado no Xcode
- [ ] Push Notifications capability habilitada no Xcode
- [ ] Firebase SDK adicionado via SwiftPM
- [ ] AppDelegate inicializa Firebase
- [ ] Archive feito, upload pro App Store Connect OK
- [ ] Build apareceu no TestFlight
- [ ] Privacy nutrition labels preenchidas
- [ ] Categoria definida como **Health & Fitness**
- [ ] Demo account fornecido em App Review Information
- [ ] Política de privacidade URL acessível

---

## Referências

- Capacitor: https://capacitorjs.com/docs/getting-started
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer: https://developer.apple.com/account
- Firebase Console: https://console.firebase.google.com/project/aciav-saude
