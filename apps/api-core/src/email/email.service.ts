import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unitId?: string | null;
}

interface ResolvedConfig {
  apiKey: string;
  from: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger('EmailService');
  private readonly fallbackApiKey = process.env.RESEND_API_KEY ?? '';
  private readonly fallbackFrom = process.env.RESEND_FROM ?? 'ACIAV Saúde <no-reply@aciavsaude.com.br>';

  constructor(private readonly prisma: PrismaService) {}

  private buildFrom(email?: string, name?: string): string | null {
    if (!email) return null;
    const safeName = (name ?? 'ACIAV Saúde').replace(/[<>]/g, '');
    return `${safeName} <${email}>`;
  }

  private async resolveConfig(unitId?: string | null): Promise<ResolvedConfig> {
    const fallback: ResolvedConfig = { apiKey: this.fallbackApiKey, from: this.fallbackFrom };
    if (!unitId) return fallback;
    try {
      const unit = await this.prisma.unit.findUnique({ where: { id: unitId }, select: { settings: true } });
      if (!unit?.settings) return fallback;
      const parsed = JSON.parse(unit.settings) as Record<string, any>;
      const email = parsed?.integrations?.email as Record<string, any> | undefined;
      if (!email) return fallback;
      const apiKey = typeof email.resendApiKey === 'string' && email.resendApiKey ? email.resendApiKey : this.fallbackApiKey;
      const from = this.buildFrom(email.fromEmail, email.fromName) ?? this.fallbackFrom;
      return { apiKey, from };
    } catch {
      return fallback;
    }
  }

  async send(payload: EmailPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    const config = await this.resolveConfig(payload.unitId);
    if (!config.apiKey) {
      this.logger.warn(`Resend API key ausente — email para ${payload.to} não enviado. Assunto: ${payload.subject}`);
      return { ok: false, error: 'RESEND_API_KEY_NOT_CONFIGURED' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Resend falhou (${res.status}) para ${payload.to}: ${body}`);
        return { ok: false, error: `resend_${res.status}` };
      }

      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, id: data.id };
    } catch (err) {
      this.logger.error(`Erro ao chamar Resend: ${(err as Error).message}`);
      return { ok: false, error: 'network_error' };
    }
  }

  renderPasswordResetEmail(params: { name: string; resetUrl: string; expiresInMinutes: number }): {
    html: string;
    text: string;
  } {
    const { name, resetUrl, expiresInMinutes } = params;
    const safeName = (name || 'beneficiário').replace(/</g, '&lt;');

    const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Redefinir senha — ACIAV Saúde</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa;padding:32px;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    <h1 style="color:#007178;margin:0 0 16px;font-size:22px;">Redefinir sua senha</h1>
    <p>Olá, <strong>${safeName}</strong>.</p>
    <p>Recebemos um pedido para redefinir a senha da sua conta na <strong>ACIAV Saúde</strong>. Clique no botão abaixo para criar uma nova senha:</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="background:#007178;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:bold;display:inline-block;">Redefinir senha</a>
    </p>
    <p style="font-size:13px;color:#64748b;">Este link expira em <strong>${expiresInMinutes} minutos</strong> e só pode ser usado uma vez.</p>
    <p style="font-size:13px;color:#64748b;">Se você não solicitou esta redefinição, pode ignorar este e-mail — sua senha atual continua válida.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="font-size:12px;color:#94a3b8;">Problemas com o botão? Copie e cole este link no navegador:<br><span style="word-break:break-all;">${resetUrl}</span></p>
  </div>
</body></html>`;

    const text = `Olá, ${safeName}.\n\nRecebemos um pedido para redefinir a senha da sua conta na ACIAV Saúde.\n\nAcesse este link para criar uma nova senha (válido por ${expiresInMinutes} minutos):\n${resetUrl}\n\nSe você não solicitou, ignore este e-mail.`;

    return { html, text };
  }
}
