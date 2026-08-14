import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
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
		path: 'reserve',
		loadComponent: () =>
			import('./pages/reserve/reserve-page').then(({ ReservePage }) => ReservePage),
	},
	{
		path: '**',
		loadComponent: () =>
			import('./pages/not-found/not-found-page').then(({ NotFoundPage }) => NotFoundPage),
	},
];
