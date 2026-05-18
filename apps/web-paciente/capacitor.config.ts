import type { CapacitorConfig } from '@capacitor/cli';

// Aponta o WebView para a PWA em producao por padrao.
// Para apontar pra dev local: defina CAPACITOR_SERVER_URL antes de rodar `npx cap sync`.
//   Android emulator: http://10.0.2.2:3003
//   iOS simulator:    http://localhost:3003
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'https://app.aciavsaude.com.br';
const cleartext = serverUrl.startsWith('http://');

const config: CapacitorConfig = {
  appId: 'br.com.aciavsaude.paciente',
  appName: 'ACIAV Saúde',
  // webDir nao e usado em runtime porque server.url aponta pra rede,
  // mas o CLI exige um diretorio existente. `public/` sempre existe no Next.
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext,
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
    // Necessario para storage persistente em PWAs carregadas via server.url
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#007178',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
