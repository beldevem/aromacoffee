import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPage } from './admin-page';

describe('AdminPage', () => {
  it('renders the dashboard shell', async () => {
    await TestBed.configureTestingModule({ imports: [AdminPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(AdminPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-admin-overview')).toBeTruthy();
  });
});
