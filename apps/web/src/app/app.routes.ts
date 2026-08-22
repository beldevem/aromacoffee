import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminOnlyGuard } from './core/auth/role.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () =>
			import('./pages/home/home-page').then(({ HomePage }) => HomePage),
	},
	{
		path: 'menu',
		loadComponent: () =>
			import('./pages/menu/menu-page').then(({ MenuPage }) => MenuPage),
	},
	{
		path: 'product/:slug',
		loadComponent: () =>
			import('./pages/product/product-page').then(({ ProductPage }) => ProductPage),
	},
	{
		path: 'visit',
		loadComponent: () =>
			import('./pages/visit/visit-page').then(({ VisitPage }) => VisitPage),
	},
	{
		path: 'events',
		loadComponent: () =>
			import('./pages/events/events-page').then(({ EventsPage }) => EventsPage),
	},
	{
		path: 'gallery',
		loadComponent: () =>
			import('./pages/gallery/gallery-page').then(({ GalleryPage }) => GalleryPage),
	},
	{
		path: 'reserve',
		loadComponent: () =>
			import('./pages/reserve/reserve-page').then(({ ReservePage }) => ReservePage),
	},
	{
		path: 'order',
		loadComponent: () => import('./pages/order/order-page').then(({ OrderPage }) => OrderPage),
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login-page').then(({ LoginPage }) => LoginPage),
	},
	{
		path: 'admin',
		canActivate: [authGuard, adminOnlyGuard],
		loadComponent: () =>
			import('./pages/admin/admin-page').then(({ AdminPage }) => AdminPage),
	},
	{
		path: 'admin/products',
		canActivate: [authGuard, adminOnlyGuard],
		loadComponent: () =>
			import('./pages/admin/products/admin-products-page').then(({ AdminProductsPage }) => AdminProductsPage),
	},
	{
		path: 'admin/reservations',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/admin/reservations/admin-reservations-page').then(({ AdminReservationsPage }) => AdminReservationsPage),
	},
	{
		path: 'admin/categories',
		canActivate: [authGuard, adminOnlyGuard],
		data: { resource: 'categories' },
		loadComponent: () => import('./pages/admin/management/admin-management-page').then(({ AdminManagementPage }) => AdminManagementPage),
	},
	{
		path: 'admin/badges',
		canActivate: [authGuard, adminOnlyGuard],
		data: { resource: 'badges' },
		loadComponent: () => import('./pages/admin/management/admin-management-page').then(({ AdminManagementPage }) => AdminManagementPage),
	},
	{
		path: 'admin/cash',
		canActivate: [authGuard, adminOnlyGuard],
		loadComponent: () => import('./pages/admin/cash/admin-cash-page').then(({ AdminCashPage }) => AdminCashPage),
	},
	{
		path: 'admin/expenses',
		canActivate: [authGuard, adminOnlyGuard],
		loadComponent: () => import('./pages/admin/expenses/admin-expenses-page').then(({ AdminExpensesPage }) => AdminExpensesPage),
	},
	{
		path: 'admin/tables',
		canActivate: [authGuard, adminOnlyGuard],
		loadComponent: () => import('./pages/admin/tables/admin-tables-page').then(({ AdminTablesPage }) => AdminTablesPage),
	},
	{
		path: 'admin/orders',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/admin/orders/admin-orders-page').then(({ AdminOrdersPage }) => AdminOrdersPage),
	},
	{
		path: 'admin/users',
		canActivate: [authGuard, adminOnlyGuard],
		data: { resource: 'users' },
		loadComponent: () => import('./pages/admin/management/admin-management-page').then(({ AdminManagementPage }) => AdminManagementPage),
	},
	{
		path: '**',
		loadComponent: () =>
			import('./pages/not-found/not-found-page').then(({ NotFoundPage }) => NotFoundPage),
	},
];
