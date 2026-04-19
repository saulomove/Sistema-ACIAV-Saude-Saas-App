import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.resolve(process.cwd(), 'backups');
const RETENTION_COUNT = 30;
const CRON_HOUR = 3;
const CRON_MINUTE = 0;

interface ActorContext {
  authUserId?: string | null;
  name?: string | null;
  role?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger('BackupService');
  private cronTimer: NodeJS.Timeout | null = null;
  private lastCronRunDate: string | null = null;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureDir();
    this.cronTimer = setInterval(() => this.tickCron().catch(() => undefined), 60 * 1000);
  }

  private async ensureDir() {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (err) {
      this.logger.error(`Falha ao criar diretório de backup: ${(err as Error).message}`);
    }
  }

  private async tickCron() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (this.lastCronRunDate === today) return;
    if (now.getHours() !== CRON_HOUR || now.getMinutes() < CRON_MINUTE || now.getMinutes() > CRON_MINUTE + 5) return;

    this.lastCronRunDate = today;
    const units = await this.prisma.unit.findMany({ select: { id: true } }).catch(() => []);
    for (const unit of units) {
      try {
        await this.runBackup(unit.id, { name: 'sistema (cron)', role: 'system' });
      } catch (err) {
        this.logger.error(`Backup automático falhou para ${unit.id}: ${(err as Error).message}`);
      }
    }
  }

  async list(unitId?: string | null) {
    return this.prisma.backup.findMany({
      where: unitId ? { unitId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async runBackup(unitId: string | null, actor: ActorContext) {
    await this.ensureDir();

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${unitId ?? 'global'}-${stamp}.json.gz`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const pending = await this.prisma.backup.create({
      data: {
        unitId: unitId ?? undefined,
        fileName,
        status: 'pending',
        createdByAuthUserId: actor.authUserId ?? undefined,
        createdByName: actor.name ?? undefined,
      },
    });

    try {
      const payload = await this.collectData(unitId);
      const json = JSON.stringify(payload, null, 2);
      const gz = gzipSync(Buffer.from(json, 'utf8'));
      await fs.writeFile(filePath, gz);
      const stat = await fs.stat(filePath);

      const completed = await this.prisma.backup.update({
        where: { id: pending.id },
        data: {
          status: 'completed',
          storageUrl: filePath,
          sizeBytes: stat.size,
        },
      });

      this.audit.log({
        unitId: unitId ?? undefined,
        actorAuthUserId: actor.authUserId ?? undefined,
        actorName: actor.name ?? undefined,
        actorRole: actor.role ?? undefined,
        entity: 'backup',
        entityId: completed.id,
        action: 'create',
        diffAfter: { fileName, sizeBytes: stat.size },
        ip: actor.ip ?? undefined,
        userAgent: actor.userAgent ?? undefined,
      });

      this.cleanupOldBackups(unitId).catch(() => undefined);

      return completed;
    } catch (err) {
      await this.prisma.backup.update({
        where: { id: pending.id },
        data: { status: 'failed', errorMessage: (err as Error).message.slice(0, 500) },
      }).catch(() => undefined);
      throw err;
    }
  }

  private async cleanupOldBackups(unitId: string | null) {
    const all = await this.prisma.backup.findMany({
      where: { unitId: unitId ?? undefined, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });
    const excess = all.slice(RETENTION_COUNT);
    for (const row of excess) {
      if (row.storageUrl) {
        await fs.unlink(row.storageUrl).catch(() => undefined);
      }
      await this.prisma.backup.delete({ where: { id: row.id } }).catch(() => undefined);
    }
  }

  private async collectData(unitId: string | null) {
    const [units, users, companies, providers, transactions, services] = await Promise.all([
      unitId
        ? this.prisma.unit.findMany({ where: { id: unitId } })
        : this.prisma.unit.findMany(),
      unitId
        ? this.prisma.user.findMany({ where: { unitId } })
        : this.prisma.user.findMany(),
      unitId
        ? this.prisma.company.findMany({ where: { unitId } })
        : this.prisma.company.findMany(),
      unitId
        ? this.prisma.provider.findMany({ where: { unitId } })
        : this.prisma.provider.findMany(),
      unitId
        ? this.prisma.transaction.findMany({ where: { user: { unitId } } })
        : this.prisma.transaction.findMany(),
      unitId
        ? this.prisma.service.findMany({ where: { provider: { unitId } } })
        : this.prisma.service.findMany(),
    ]);

    return {
      meta: {
        generatedAt: new Date().toISOString(),
        unitId: unitId ?? null,
        counts: {
          units: units.length,
          users: users.length,
          companies: companies.length,
          providers: providers.length,
          transactions: transactions.length,
          services: services.length,
        },
      },
      units,
      users,
      companies,
      providers,
      transactions,
      services,
    };
  }

  async getDownload(id: string, unitId: string | null) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException('Backup não encontrado.');
    if (unitId && backup.unitId && backup.unitId !== unitId) {
      throw new NotFoundException('Backup não encontrado.');
    }
    if (backup.status !== 'completed' || !backup.storageUrl) {
      throw new BadRequestException('Backup ainda não está disponível.');
    }
    const buffer = await fs.readFile(backup.storageUrl);
    return { buffer, fileName: backup.fileName };
  }
}
