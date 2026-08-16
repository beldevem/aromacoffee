import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/client';

// The dashboard reports daily takings, so it is management information only.
@Controller('dashboard')
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  stats() {
    return this.dashboard.stats();
  }
}
