import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    return this.authService.me(req.user.sub);
  }

  @Get('admin-users')
  @UseGuards(AuthGuard('jwt'))
  listAdminUsers(@Req() req: any, @Query('role') role?: string, @Query('unitId') unitId?: string) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.authService.listAdminUsers({ role, unitId });
  }

  @Post('admin-users')
  @UseGuards(AuthGuard('jwt'))
  createAdminUser(
    @Req() req: any,
    @Body() body: {
      email: string;
      password: string;
      role: string;
      unitId?: string;
      companyId?: string;
      providerId?: string;
    },
  ) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.authService.createAdminUser(body);
  }

  @Post('reset-password/provider/:providerId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async resetProviderPassword(@Req() req: any, @Param('providerId') providerId: string) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    return this.authService.resetPasswordByProvider(providerId);
  }

  @Post('reset-password/company/:companyId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async resetCompanyPassword(@Req() req: any, @Param('companyId') companyId: string) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    return this.authService.resetPasswordByCompany(companyId);
  }

  @Post('reset-password/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async resetUserPassword(@Req() req: any, @Param('userId') userId: string) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    return this.authService.resetPasswordByUser(userId);
  }

  @Patch('admin-users/:id/status')
  @UseGuards(AuthGuard('jwt'))
  toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.authService.toggleAdminUserStatus(id, body.status);
  }

  @Patch('admin-users/:id')
  @UseGuards(AuthGuard('jwt'))
  updateAdmin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { email?: string; role?: string; unitId?: string | null },
  ) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.authService.updateAdminUser(id, {
      email: body.email,
      role: body.role,
      unitId: body.unitId ?? undefined,
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  forgotPassword(@Req() req: Request, @Body() body: { identifier?: string; email?: string }) {
    const identifier = body.identifier || body.email || '';
    const origin = (req.headers.origin as string | undefined) ?? null;
    return this.authService.forgotPassword(identifier, origin);
  }

  @Get('reset-password/validate')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  validateResetToken(@Query('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  resetPasswordConfirm(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPasswordWithToken(body.token, body.newPassword);
  }
}
