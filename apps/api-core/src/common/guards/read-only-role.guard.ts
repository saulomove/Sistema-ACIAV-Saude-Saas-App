import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Bloqueia qualquer escrita (POST/PUT/PATCH/DELETE) quando o usuário autenticado
 * tem role=provider. O portal do credenciado virou somente leitura — quem registra
 * atendimentos e altera cadastros é o administrador.
 */
@Injectable()
export class ReadOnlyProviderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== 'provider') return true;
    if (!WRITE_METHODS.has(req.method)) return true;
    throw new ForbiddenException('Seu portal é apenas para consulta. Para alterações, fale com a administração.');
  }
}
