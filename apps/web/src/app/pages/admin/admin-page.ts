import { Component } from '@angular/core';
import { AdminOverview } from './components/admin-overview/admin-overview';
import { AdminProducts } from './components/admin-products/admin-products';
import { AdminReservations } from './components/admin-reservations/admin-reservations';
import { AdminSidebar } from './components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from './components/admin-topbar/admin-topbar';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [AdminOverview, AdminProducts, AdminReservations, AdminSidebar, AdminTopbar],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage {}
