import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const VALID_PLATFORMS = new Set(['ios', 'android', 'web']);

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseEnabled = false;

  constructor(private prisma: PrismaService) {
    this.initFirebase();
  }

  private initFirebase() {
    if (admin.apps.length > 0) {
      this.firebaseEnabled = true;
      return;
    }
    const credentialPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
      path.join(process.cwd(), 'secrets', 'firebase-service-account.json');
    try {
      if (!fs.existsSync(credentialPath)) {
        this.logger.warn(
          `Firebase service account nao encontrado em ${credentialPath} — push notifications desabilitado.`,
        );
        return;
      }
      const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.firebaseEnabled = true;
      this.logger.log(`Firebase Admin inicializado (project=${serviceAccount.project_id}).`);
    } catch (err) {
      this.logger.error('Falha ao inicializar Firebase Admin SDK.', err as Error);
    }
  }

  async registerToken(
    authUserId: string,
    userId: string | null,
    token: string,
    platform: string,
    deviceLabel: string | null,
  ) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token inválido.');
    }
    const normalizedPlatform = (platform ?? '').toLowerCase();
    if (!VALID_PLATFORMS.has(normalizedPlatform)) {
      throw new BadRequestException('Plataforma inválida.');
    }

    // Upsert by token (mesmo dispositivo pode trocar de usuario)
    return this.prisma.pushToken.upsert({
      where: { token },
      create: {
        authUserId,
        userId,
        token,
        platform: normalizedPlatform,
        deviceLabel: deviceLabel?.slice(0, 80) ?? null,
      },
      update: {
        authUserId,
        userId,
        platform: normalizedPlatform,
        deviceLabel: deviceLabel?.slice(0, 80) ?? null,
        lastSeenAt: new Date(),
      },
    });
  }

  async unregisterToken(authUserId: string, token: string) {
    return this.prisma.pushToken.deleteMany({
      where: { token, authUserId },
    });
  }

  /**
   * Envia push notification para um usuario especifico (todos os devices dele).
   * Retorna { sent, failed, removed } onde `removed` sao tokens invalidos que foram deletados.
   */
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<{ sent: number; failed: number; removed: number }> {
    if (!this.firebaseEnabled) {
      this.logger.warn('Push desabilitado — Firebase nao inicializado.');
      return { sent: 0, failed: 0, removed: 0 };
    }
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length === 0) return { sent: 0, failed: 0, removed: 0 };

    const tokenList = tokens.map((t) => t.token);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenList,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokenList[idx]);
        }
      }
    });
    if (invalidTokens.length > 0) {
      await this.prisma.pushToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }
    return {
      sent: response.successCount,
      failed: response.failureCount,
      removed: invalidTokens.length,
    };
  }
}
