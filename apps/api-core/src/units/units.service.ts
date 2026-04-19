import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SENSITIVE_EMAIL_KEYS = ['resendApiKey', 'smtpPass'] as const;

function maskSecret(val?: string): string {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 6) return '•'.repeat(val.length);
  return `${val.slice(0, 3)}••••${val.slice(-3)}`;
}

function sanitizeSettings(raw?: string | null): string | null {
  if (!raw) return raw ?? null;
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    const integrations = parsed.integrations as Record<string, any> | undefined;
    if (integrations?.email && typeof integrations.email === 'object') {
      const e = { ...(integrations.email as Record<string, any>) };
      if (e.resendApiKey) {
        e.resendApiKeyMask = maskSecret(e.resendApiKey);
        delete e.resendApiKey;
      }
      if (e.smtpPass) {
        e.smtpPassMask = maskSecret(e.smtpPass);
        delete e.smtpPass;
      }
      integrations.email = e;
      parsed.integrations = integrations;
    }
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

function mergeSettingsSecrets(prevRaw: string | null | undefined, nextRaw: string): string {
  try {
    const prev = prevRaw ? (JSON.parse(prevRaw) as Record<string, any>) : {};
    const next = JSON.parse(nextRaw) as Record<string, any>;
    const prevEmail = prev?.integrations?.email ?? {};
    const nextEmail = next?.integrations?.email;
    if (nextEmail && typeof nextEmail === 'object') {
      for (const key of SENSITIVE_EMAIL_KEYS) {
        if (!nextEmail[key] || nextEmail[key] === '') {
          if (prevEmail[key]) nextEmail[key] = prevEmail[key];
          else delete nextEmail[key];
        }
      }
      delete nextEmail.resendApiKeyMask;
      delete nextEmail.smtpPassMask;
      next.integrations = { ...(next.integrations ?? {}), email: nextEmail };
    }
    return JSON.stringify(next);
  } catch {
    return nextRaw;
  }
}

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const units = await this.prisma.unit.findMany({
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return units.map((u) => ({ ...u, settings: sanitizeSettings(u.settings) }));
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
    });
    if (!unit) return unit;
    return { ...unit, settings: sanitizeSettings(unit.settings) };
  }

  async create(data: { name: string; subdomain: string; settings?: string }) {
    return this.prisma.unit.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    subdomain?: string;
    settings?: string;
    status?: boolean;
    supportWhatsapp?: string | null;
    featuresRewards?: boolean;
  }) {
    const allowed: any = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.subdomain !== undefined) allowed.subdomain = data.subdomain;
    if (data.settings !== undefined) {
      const existing = await this.prisma.unit.findUnique({ where: { id }, select: { settings: true } });
      allowed.settings = mergeSettingsSecrets(existing?.settings ?? null, data.settings);
    }
    if (data.status !== undefined) allowed.status = data.status;
    if (data.supportWhatsapp !== undefined) {
      const raw = typeof data.supportWhatsapp === 'string' ? data.supportWhatsapp.replace(/\D/g, '') : null;
      allowed.supportWhatsapp = raw ? raw : null;
    }
    if (data.featuresRewards !== undefined) allowed.featuresRewards = !!data.featuresRewards;
    const updated = await this.prisma.unit.update({ where: { id }, data: allowed });
    return { ...updated, settings: sanitizeSettings(updated.settings) };
  }

  async remove(id: string) {
    return this.prisma.unit.update({ where: { id }, data: { status: false } });
  }

  async getRawSettings(id: string): Promise<string | null> {
    const unit = await this.prisma.unit.findUnique({ where: { id }, select: { settings: true } });
    return unit?.settings ?? null;
  }
}
