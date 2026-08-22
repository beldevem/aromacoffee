import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminExpensesPage } from './admin-expenses-page';

describe('AdminExpensesPage', () => {
  it('creates the expenses page and displays title', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminExpensesPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminExpensesPage);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.expenses-page')).toBeTruthy();
  });
});
