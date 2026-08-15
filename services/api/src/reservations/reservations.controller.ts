import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('reservations')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get()
  findAll() { return this.reservations.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.reservations.findOne(id); }

  @Post()
  @Public()
  create(@Body() dto: CreateReservationDto, @Req() request: Request & { user?: { name: string } }) { return this.reservations.create(dto, request.user?.name ?? 'customer'); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto, @Req() request: Request & { user: { name: string } }) { return this.reservations.update(id, dto, request.user.name); }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request & { user: { name: string } }) { return this.reservations.remove(id, request.user.name); }
}
