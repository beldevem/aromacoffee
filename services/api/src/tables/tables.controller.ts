import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('tables')
@Roles(UserRole.ADMIN)
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  @Get() findAll() { return this.tables.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.tables.findOne(id); }
  @Post() create(@Body() dto: CreateTableDto) { return this.tables.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTableDto) { return this.tables.update(id, dto); }
  @Post(':id/rotate-token') rotate(@Param('id') id: string) { return this.tables.rotateToken(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.tables.remove(id); }
}
