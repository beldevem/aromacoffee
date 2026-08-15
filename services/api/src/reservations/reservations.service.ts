import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.reservation.findMany({ orderBy: { dateTime: 'asc' } });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found.');
    return reservation;
  }

  create(dto: CreateReservationDto, actorName = 'customer') {
    const status = dto.source === 'website' ? 'PENDING' : dto.status ?? 'PENDING';
    return this.prisma.reservation.create({ data: { ...dto, status, createdBy: actorName, lastUpdatedBy: actorName, dateTime: new Date(dto.dateTime) } });
  }

  async update(id: string, dto: UpdateReservationDto, actorName: string) {
    await this.findOne(id);
    const data = { ...dto, lastUpdatedBy: actorName, ...(dto.dateTime ? { dateTime: new Date(dto.dateTime) } : {}) };
    const reservation = await this.prisma.reservation.update({ where: { id }, data });
    await this.prisma.auditLog.create({ data: { action: dto.status ? `status:${dto.status}` : 'update', entity: 'reservation', entityId: id, metadata: { actor: actorName, changes: dto as object } } });
    return reservation;
  }

  async remove(id: string, actorName: string) {
    await this.findOne(id);
    await this.prisma.reservation.delete({ where: { id } });
    await this.prisma.auditLog.create({ data: { action: 'delete', entity: 'reservation', entityId: id, metadata: { actor: actorName } } });
    return { id, deleted: true };
  }
}
