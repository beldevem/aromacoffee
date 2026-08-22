import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { ToastService } from '../../../core/notifications/toast.service';
import { CsvExportService } from '../../../core/utils/csv-export.service';

export type ExpenseCategory =
  | 'INGREDIENTS'
  | 'RENT'
  | 'UTILITIES'
  | 'EQUIPMENT'
  | 'SALARIES'
  | 'MAINTENANCE'
  | 'SUPPLIES'
  | 'MARKETING'
  | 'TAXES'
  | 'OTHER';

export interface ExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  amountCents: number;
  date: string;
  paymentMethod: 'CASH' | 'CARD' | null;
  invoiceNumber: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CategorySummary {
  count: number;
  totalCents: number;
  percentage: number;
}

export interface ExpenseSummary {
  totalCount: number;
  totalCents: number;
  revenueCents: number;
  netProfitCents: number;
  byCategory: Record<string, CategorySummary>;
}

export interface CategoryOption {
  key: ExpenseCategory;
  icon: string;
  labelKey: string;
}

export const CATEGORY_DEFINITIONS: CategoryOption[] = [
  { key: 'INGREDIENTS', icon: '☕', labelKey: 'admin.expenses.cat.ingredients' },
  { key: 'UTILITIES', icon: '💡', labelKey: 'admin.expenses.cat.utilities' },
  { key: 'RENT', icon: '🏢', labelKey: 'admin.expenses.cat.rent' },
  { key: 'EQUIPMENT', icon: '⚙️', labelKey: 'admin.expenses.cat.equipment' },
  { key: 'SALARIES', icon: '👥', labelKey: 'admin.expenses.cat.salaries' },
  { key: 'MAINTENANCE', icon: '🛠️', labelKey: 'admin.expenses.cat.maintenance' },
  { key: 'SUPPLIES', icon: '📦', labelKey: 'admin.expenses.cat.supplies' },
  { key: 'MARKETING', icon: '📢', labelKey: 'admin.expenses.cat.marketing' },
  { key: 'TAXES', icon: '📑', labelKey: 'admin.expenses.cat.taxes' },
  { key: 'OTHER', icon: '🏷️', labelKey: 'admin.expenses.cat.other' },
];

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-TN' };

@Component({
  selector: 'app-admin-expenses-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, FormsModule],
  templateUrl: './admin-expenses-page.html',
  styleUrl: './admin-expenses-page.scss',
})
export class AdminExpensesPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);

  protected readonly categoryOptions = CATEGORY_DEFINITIONS;

  // Data signals
  protected readonly expenses = signal<ExpenseItem[]>([]);
  protected readonly summary = signal<ExpenseSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  // Filter signals
  protected readonly selectedPeriod = signal<'today' | 'month' | 'year' | 'all'>('month');
  protected readonly selectedCategory = signal<string>('ALL');
  protected readonly searchQuery = signal('');

  // Quick-Add bar signals
  protected readonly quickTitle = signal('');
  protected readonly quickAmount = signal('');
  protected readonly quickCategory = signal<ExpenseCategory>('INGREDIENTS');
  protected readonly quickPaymentMethod = signal<'CASH' | 'CARD'>('CASH');
  protected readonly quickAdding = signal(false);

  // Modal form signals
  protected readonly showModal = signal(false);
  protected readonly editingId = signal<string | null>(null);

  // Form model fields
  protected formTitle = '';
  protected formCategory: ExpenseCategory = 'INGREDIENTS';
  protected formAmountDt = '';
  protected formDate = new Date().toISOString().slice(0, 10);
  protected formPaymentMethod: 'CASH' | 'CARD' = 'CASH';
  protected formInvoiceNumber = '';
  protected formNote = '';
  protected readonly formItems = signal<{ description: string; quantity: number; amountDt: number }[]>([]);

  protected readonly filteredExpenses = computed(() => {
    const list = this.expenses();
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return list.filter((e) => {
      if (cat !== 'ALL' && e.category !== cat) return false;
      if (query) {
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesInvoice = e.invoiceNumber?.toLowerCase().includes(query);
        const matchesNote = e.note?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesInvoice && !matchesNote) return false;
      }
      return true;
    });
  });

  protected readonly activeCategorySummary = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return this.categoryOptions
      .map((cat) => {
        const data = s.byCategory[cat.key] || { count: 0, totalCents: 0, percentage: 0 };
        return {
          ...cat,
          count: data.count,
          totalCents: data.totalCents,
          percentage: data.percentage,
        };
      })
      .filter((c) => c.totalCents > 0)
      .sort((a, b) => b.totalCents - a.totalCents);
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected setPeriod(period: 'today' | 'month' | 'year' | 'all'): void {
    this.selectedPeriod.set(period);
    this.loadData();
  }

  protected setCategoryFilter(catKey: string): void {
    this.selectedCategory.set(catKey);
  }

  protected loadData(): void {
    this.loading.set(true);
    let params = new HttpParams();
    const p = this.selectedPeriod();
    if (p !== 'all') {
      params = params.set('period', p);
    }

    this.http.get<ExpenseItem[]>(`${API_BASE_URL}/expenses`, { params }).subscribe({
      next: (items) => {
        this.expenses.set(items);
        this.loadSummary();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.i18n.t('order.error.generic'));
      },
    });
  }

  protected loadSummary(): void {
    let params = new HttpParams();
    const p = this.selectedPeriod();
    if (p !== 'all') {
      params = params.set('period', p);
    }

    this.http.get<ExpenseSummary>(`${API_BASE_URL}/expenses/summary`, { params }).subscribe({
      next: (sum) => {
        this.summary.set(sum);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected submitQuickAdd(): void {
    const title = this.quickTitle().trim();
    const amountVal = parseFloat(this.quickAmount());

    if (!title) {
      this.toast.error('Veuillez saisir une description pour la dépense rapide.');
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      this.toast.error('Veuillez saisir un montant valide.');
      return;
    }

    const amountCents = Math.round(amountVal * 100);
    this.quickAdding.set(true);

    this.http
      .post<ExpenseItem>(`${API_BASE_URL}/expenses`, {
        title,
        category: this.quickCategory(),
        amountCents,
        date: new Date().toISOString(),
        paymentMethod: this.quickPaymentMethod(),
      })
      .subscribe({
        next: () => {
          this.quickAdding.set(false);
          this.quickTitle.set('');
          this.quickAmount.set('');
          this.toast.success('Dépense ajoutée avec succès !');
          this.loadData();
        },
        error: (err) => {
          this.quickAdding.set(false);
          this.toast.error(err.error?.message || this.i18n.t('order.error.generic'));
        },
      });
  }

  protected addFormItem(description = '', quantity = 1, amountDt = 0): void {
    this.formItems.update((items) => [...items, { description, quantity, amountDt }]);
    this.recalculateTotalFromItems();
  }

  protected removeFormItem(index: number): void {
    this.formItems.update((items) => items.filter((_, i) => i !== index));
    this.recalculateTotalFromItems();
  }

  protected updateItemAmount(index: number, valStr: string): void {
    const val = parseFloat(valStr) || 0;
    this.formItems.update((items) => {
      const copy = [...items];
      if (copy[index]) copy[index].amountDt = val;
      return copy;
    });
    this.recalculateTotalFromItems();
  }

  protected recalculateTotalFromItems(): void {
    const items = this.formItems();
    if (items.length > 0) {
      const sum = items.reduce((acc, it) => acc + (it.amountDt || 0) * (it.quantity || 1), 0);
      if (sum > 0) {
        this.formAmountDt = sum.toFixed(2);
      }
    }
  }

  protected openCreateModal(): void {
    this.editingId.set(null);
    this.formTitle = '';
    this.formCategory = 'INGREDIENTS';
    this.formAmountDt = '';
    this.formDate = new Date().toISOString().slice(0, 10);
    this.formPaymentMethod = 'CASH';
    this.formInvoiceNumber = '';
    this.formNote = '';
    this.formItems.set([]);
    this.showModal.set(true);
  }

  protected openEditModal(item: ExpenseItem): void {
    this.editingId.set(item.id);
    this.formTitle = item.title;
    this.formCategory = item.category;
    this.formAmountDt = (item.amountCents / 100).toFixed(2);
    this.formDate = item.date.slice(0, 10);
    this.formPaymentMethod = item.paymentMethod || 'CASH';
    this.formInvoiceNumber = item.invoiceNumber || '';
    this.formNote = item.note || '';
    this.formItems.set([]);
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formItems.set([]);
  }

  protected saveExpense(): void {
    const title = this.formTitle.trim();
    const amountVal = parseFloat(this.formAmountDt);

    if (!title) {
      this.toast.error('Veuillez saisir une description pour la dépense.');
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      this.toast.error('Veuillez saisir un montant valide.');
      return;
    }

    const amountCents = Math.round(amountVal * 100);
    const payload = {
      title,
      category: this.formCategory,
      amountCents,
      date: new Date(this.formDate).toISOString(),
      paymentMethod: this.formPaymentMethod,
      invoiceNumber: this.formInvoiceNumber.trim() || undefined,
      note: this.formNote.trim() || undefined,
    };

    this.saving.set(true);
    const id = this.editingId();

    const request$ = id
      ? this.http.patch<ExpenseItem>(`${API_BASE_URL}/expenses/${id}`, payload)
      : this.http.post<ExpenseItem>(`${API_BASE_URL}/expenses`, payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.toast.success(id ? 'Dépense mise à jour.' : 'Dépense enregistrée.');
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.error?.message || this.i18n.t('order.error.generic'));
      },
    });
  }

  protected deleteExpense(id: string): void {
    if (!confirm(this.i18n.t('admin.expenses.deleteConfirm'))) return;

    this.http.delete(`${API_BASE_URL}/expenses/${id}`).subscribe({
      next: () => {
        this.toast.success('Dépense supprimée.');
        this.loadData();
      },
      error: () => {
        this.toast.error(this.i18n.t('order.error.generic'));
      },
    });
  }

  protected getCategoryMeta(key: string): CategoryOption {
    return (
      this.categoryOptions.find((c) => c.key === key) || {
        key: 'OTHER',
        icon: '🏷️',
        labelKey: 'admin.expenses.cat.other',
      }
    );
  }

  protected formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)} DT`;
  }

  protected formatDate(dateStr: string): string {
    const locale = DATE_LOCALES[this.i18n.locale()] ?? 'fr-FR';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  }

  protected exportExpenses(): void {
    const list = this.filteredExpenses();
    if (list.length === 0) {
      this.toast.error('Aucune dépense à exporter pour cette sélection.');
      return;
    }

    this.csv.exportToCsv<ExpenseItem>(
      list,
      [
        { header: 'Date', transform: (r) => r.date ? new Date(r.date).toLocaleDateString('fr-TN') : '' },
        { header: 'Titre / Description', key: 'title' },
        { header: 'Catégorie', transform: (r) => this.i18n.t(this.getCategoryMeta(r.category).labelKey) },
        { header: 'Montant (DT)', transform: (r) => (r.amountCents / 100).toFixed(2) },
        { header: 'Mode de Paiement', transform: (r) => r.paymentMethod === 'CARD' ? 'Carte' : 'Espèces' },
        { header: 'N° Facture', transform: (r) => r.invoiceNumber || '' },
        { header: 'Note', transform: (r) => r.note || '' },
        { header: 'Enregistrée par', key: 'createdBy' },
      ],
      `depenses_aroma_${this.selectedPeriod()}`,
    );
    this.toast.success(`${list.length} dépense(s) exportée(s) en CSV !`);
  }
}
