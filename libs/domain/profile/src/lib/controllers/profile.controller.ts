import { Controller, Get, Put, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@nexel/domain-auth';
import { Profile } from '@nexel/shared-types';
import { ProfileService } from '../services/profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string, @Req() req: any) {
    return this.profileService.findProfileForViewer(id, req.user);
  }

  @Put(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() data: Partial<Profile>,
    @Req() req: any
  ) {
    const profile = await this.profileService.findById(id);
    const isOwnProfile = String(profile.userId) === String(req.user.id || req.user._id);
    const isAdmin = req.user.systemRole === 'ADM';

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenException('Você não tem permissão para alterar este perfil.');
    }

    if (!profile.pubgAccountId) {
      throw new ForbiddenException('Este perfil não está associado a uma conta do PUBG.');
    }

    return this.profileService.updateProfile(profile.pubgAccountId, data);
  }
}
