import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Credenciado (role=provider) pode alterar o próprio perfil, senha, foto e horário.
 * Escritas em serviços (CRUD da tabela de serviços) continuam bloqueadas e só podem
 * ser feitas pela administração da ACIAV.
 */
@Injectable()
export class ReadOnlyProviderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== 'provider') return true;
    if (!WRITE_METHODS.has(req.method)) return true;

    const rawUrl: string = req.originalUrl || req.url || '';
    const path = rawUrl.split('?')[0];

    // Bloqueia qualquer write em rotas de serviços do credenciado.
    // Ex.: POST /providers/:id/services, PUT /providers/services/:id, DELETE /providers/services/:id
    if (/\/providers\/(services\/|[^/]+\/services)/i.test(path)) {
      throw new ForbiddenException(
        'Alterações em serviços só podem ser feitas pela administração da ACIAV. Solicite pelo WhatsApp.',
      );
    }

    // Bloqueia escrita em rewards (brindes/prêmios) — gestão fica com admin.
    if (/\/providers\/.*\/rewards|\/providers\/rewards\//i.test(path)) {
      throw new ForbiddenException(
        'Alterações em prêmios só podem ser feitas pela administração da ACIAV.',
      );
    }

    return true;
  }
}
