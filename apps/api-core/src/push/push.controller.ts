import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PushService } from './push.service';

@Controller('push')
@UseGuards(AuthGuard('jwt'))
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('token')
  async register(
    @Req() req: any,
    @Body() body: { token: string; platform: string; deviceLabel?: string },
  ) {
    const authUserId = req.user.sub;
    const userId = req.user.userId ?? null;
    await this.pushService.registerToken(
      authUserId,
      userId,
      body.token,
      body.platform,
      body.deviceLabel ?? null,
    );
    return { ok: true };
  }

  @Delete('token')
  async unregister(@Req() req: any, @Body() body: { token: string }) {
    const authUserId = req.user.sub;
    await this.pushService.unregisterToken(authUserId, body.token);
    return { ok: true };
  }
}
