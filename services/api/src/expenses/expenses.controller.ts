import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Roles } from '../auth/roles.decorator';
import { ExpenseCategory, UserRole } from '../generated/prisma/client';

type AdminRequest = Request & { user: { name: string } };

@Controller('expenses')
@Roles(UserRole.ADMIN)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  findAll(
    @Query('category') category?: ExpenseCategory,
    @Query('period') period?: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('search') search?: string,
  ) {
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;
    return this.expenses.findAll({ category, period, from, to, search });
  }

  @Get('summary')
  summary(
    @Query('category') category?: ExpenseCategory,
    @Query('period') period?: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;
    return this.expenses.summary({ category, period, from, to });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.expenses.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @Req() req: AdminRequest) {
    return this.expenses.create(dto, { name: req.user.name });
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenses.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.expenses.delete(id);
  }
}
