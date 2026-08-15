import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('badges')
@Roles(UserRole.ADMIN)
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}
  @Get() findAll() { return this.badges.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.badges.findOne(id); }
  @Post() create(@Body() dto: CreateBadgeDto) { return this.badges.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBadgeDto) { return this.badges.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.badges.remove(id); }
}
