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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    return this.authService.me(req.user.sub);
  }

  @Get('admin-users')
  @UseGuards(AuthGuard('jwt'))
  listAdminUsers(@Query('role') role?: string, @Query('unitId') unitId?: string) {
    return this.authService.listAdminUsers({ role, unitId });
  }

  @Post('admin-users')
  @UseGuards(AuthGuard('jwt'))
  createAdminUser(@Body() body: {
    email: string;
    password: string;
    role: string;
    unitId?: string;
    companyId?: string;
    providerId?: string;
  }) {
    return this.authService.createAdminUser(body);
  }

  @Patch('admin-users/:id/status')
  @UseGuards(AuthGuard('jwt'))
  toggleStatus(@Param('id') id: string, @Body() body: { status: boolean }) {
    return this.authService.toggleAdminUserStatus(id, body.status);
  }
}
