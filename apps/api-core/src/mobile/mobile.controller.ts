import { Controller, Get, Query } from '@nestjs/common';

type Platform = 'android' | 'ios';

interface VersionInfo {
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  message: string | null;
  storeUrl: string | null;
}

/**
 * Configurado via variaveis de ambiente.
 * Default valores conservadores enquanto o app nao estiver publicado.
 */
function getVersion(platform: Platform): VersionInfo {
  const upper = platform.toUpperCase();
  const minVersion = process.env[`APP_${upper}_MIN_VERSION`] ?? '1.0.0';
  const latestVersion = process.env[`APP_${upper}_LATEST_VERSION`] ?? '1.0.0';
  const forceUpdate = process.env[`APP_${upper}_FORCE_UPDATE`] === '1';
  const message = process.env[`APP_${upper}_UPDATE_MESSAGE`] ?? null;
  const storeUrl = platform === 'android'
    ? process.env.APP_ANDROID_STORE_URL ?? null
    : process.env.APP_IOS_STORE_URL ?? null;
  return { minVersion, latestVersion, forceUpdate, message, storeUrl };
}

@Controller('app')
export class MobileController {
  @Get('version')
  getAppVersion(@Query('platform') platform?: string) {
    const normalized = (platform ?? '').toLowerCase();
    if (normalized === 'android' || normalized === 'ios') {
      return getVersion(normalized as Platform);
    }
    return {
      android: getVersion('android'),
      ios: getVersion('ios'),
    };
  }
}
