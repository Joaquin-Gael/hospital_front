import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { DataTableComponent, DataTableActionsConfig, TableColumn } from '../../shared/data-table/data-table.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { EntityFormComponent, EntityFormPayload, FormField } from '../../shared/entity-form/entity-form.component';
import { CashesService } from '../../services/cashes/cashes.service';
import { LoggerService } from '../../services/core/logger.service';
import { NotificationService } from '../../core/notification';
import { HttpErrorResponse } from '@angular/common/http';

// Interfaz adaptada al backend real
interface CashRow {
  id: string;
  income: number;
  expense: number;
  date: string;
  time_transaction: string;
  balance: number;
  details?: any;
  // Campos calculados para mostrar
  formattedIncome: string;
  formattedExpense: string;
  formattedBalance: string;
  formattedDate: string;
  formattedTime: string;
  transactionType: 'Ingreso' | 'Egreso' | 'Sin movimiento';
}

type CashFormValues = EntityFormPayload & {
  id?: string;
  income: number | string;
  expense: number | string;
  date: string;
  time_transaction?: string;
  balance?: number | string;
};

@Component({
  selector: 'app-cashes-list',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    DataTableComponent,
    ViewDialogComponent,
    EntityFormComponent,
  ],
  templateUrl: './cashes-list.component.html',
  styleUrls: ['./cashes-list.component.scss'],
})
export class CashesListComponent implements OnInit {
  private readonly cashesService = inject(CashesService);
  private readonly logger = inject(LoggerService);
  private readonly notificationService = inject(NotificationService);

  readonly tableActions: DataTableActionsConfig = {
    delete: false,
    ban: false,
    unban: false,
    download: false,
  };

  cashes = signal<CashRow[]>([]);
  loading = signal(false);
  formLoading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  selectedCash = signal<CashRow | null>(null);
  viewDialogOpen = signal(false);
  viewDialogData: Partial<CashRow> = {};
  viewDialogTitle = signal('');

  // Filtros adaptados
  transactionTypeFilter = signal<'all' | 'income' | 'expense'>('all');
  dateFilter = signal('');

  readonly filteredCashes = computed<CashRow[]>(() => {
    const type = this.transactionTypeFilter();
    const date = this.dateFilter().trim();

    return this.cashes().filter((cash) => {
      const matchesType =
        type === 'all'
          ? true
          : type === 'income'
          ? cash.income > 0
          : cash.expense > 0;

      const matchesDate = date ? cash.date.includes(date) : true;

      return matchesType && matchesDate;
    });
  });

  readonly headerActions: ActionButton[] = [
    {
      label: 'Nueva transacción',
      icon: 'add',
      ariaLabel: 'Crear nueva transacción de caja',
      variant: 'primary',
      onClick: () => this.onAddNew(),
    },
    {
      label: 'Refrescar',
      icon: 'refresh',
      ariaLabel: 'Actualizar lista de transacciones',
      variant: 'secondary',
      onClick: () => this.loadData(),
    },
  ];

  readonly tableColumns: TableColumn[] = [
    { key: 'id', label: '#ID' },
    { key: 'formattedDate', label: 'Fecha' },
    { key: 'formattedTime', label: 'Hora' },
    { key: 'transactionType', label: 'Tipo' },
    { key: 'formattedIncome', label: 'Ingreso' },
    { key: 'formattedExpense', label: 'Egreso' },
    { key: 'formattedBalance', label: 'Balance' },
  ];

  readonly viewDialogColumns: ViewDialogColumn[] = [
    { key: 'id', label: 'ID de Transacción' },
    { key: 'transactionType', label: 'Tipo de Transacción' },
    { key: 'formattedIncome', label: 'Ingreso' },
    { key: 'formattedExpense', label: 'Egreso' },
    { key: 'formattedBalance', label: 'Balance' },
    { key: 'formattedDate', label: 'Fecha' },
    { key: 'formattedTime', label: 'Hora' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cashesService.getCashes().subscribe({
      next: (cashes) => {
        const mapped = cashes.map((cash) => this.mapCashToRow(cash));
        this.cashes.set(mapped);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar las transacciones de caja');
        this.loading.set(false);
      },
    });
  }

  onAddNew(): void {
    this.formMode.set('create');
    this.selectedCash.set(null);
    this.showForm.set(true);
    this.formInitialData = {
      income: 0,
      expense: 0,
      date: new Date().toISOString().split('T')[0],
      balance: 0,
    };
  }

  onEdit(cash: CashRow): void {
    this.formMode.set('edit');
    this.selectedCash.set(cash);
    this.showForm.set(true);
    this.formInitialData = {
      income: cash.income,
      expense: cash.expense,
      date: cash.date,
      time_transaction: cash.time_transaction,
      balance: cash.balance,
    };
  }

  onView(cash: CashRow): void {
    this.viewDialogData = cash;
    this.viewDialogTitle.set(`Transacción ${cash.id}`);
    this.viewDialogOpen.set(true);
  }

  onFormSubmit(formData: CashFormValues): void {
    this.formLoading.set(true);
    this.error.set(null);

    const income = Number(formData.income);
    const expense = Number(formData.expense);
    const balance = Number(formData.balance || 0);

    const payload = {
      ...formData,
      income,
      expense,
      balance,
      id: this.formMode() === 'edit' ? this.selectedCash()?.id : undefined,
    };

    this.cashesService.createOrUpdateCash(payload).subscribe({
      next: (cash) => {
        this.notificationService.success(
          this.formMode() === 'create'
            ? 'Transacción creada correctamente'
            : 'Transacción actualizada correctamente'
        );
        this.logger.info('Transacción guardada', cash);
        this.formLoading.set(false);
        this.showForm.set(false);
        this.selectedCash.set(null);
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(
          error,
          this.formMode() === 'create'
            ? 'Error al crear la transacción'
            : 'Error al actualizar la transacción'
        );
        this.formLoading.set(false);
      },
    });
  }

  onFormCancel(): void {
    this.showForm.set(false);
    this.selectedCash.set(null);
    this.formInitialData = null;
  }

  onTransactionTypeFilterChange(type: string): void {
    this.transactionTypeFilter.set(type as 'all' | 'income' | 'expense');
  }

  onDateFilterChange(date: string): void {
    this.dateFilter.set(date);
  }

  applyFilters(): void {
    // Los filtros se aplican automáticamente por el computed
  }

  resetFilters(): void {
    this.transactionTypeFilter.set('all');
    this.dateFilter.set('');
  }

  closeViewDialog(): void {
    this.viewDialogOpen.set(false);
    this.viewDialogData = {};
  }

  get formFields(): FormField<CashFormValues>[] {
    return [
      {
        key: 'date',
        label: 'Fecha',
        type: 'date',
        required: true,
        validators: [Validators.required],
      },
      {
        key: 'income',
        label: 'Ingreso',
        type: 'number',
        required: true,
        validators: [Validators.required, Validators.min(0)],
        placeholder: 'Monto de ingreso',
      },
      {
        key: 'expense',
        label: 'Egreso',
        type: 'number',
        required: true,
        validators: [Validators.required, Validators.min(0)],
        placeholder: 'Monto de egreso',
      },
      {
        key: 'balance',
        label: 'Balance',
        type: 'number',
        required: false,
        validators: [Validators.min(0)],
        placeholder: 'Balance resultante',
      },
    ];
  }

  formInitialData: Partial<CashFormValues> | null = null;

  private mapCashToRow(cash: any): CashRow {
    const income = cash.income || 0;
    const expense = cash.expense || 0;
    
    let transactionType: 'Ingreso' | 'Egreso' | 'Sin movimiento';
    if (income > 0) transactionType = 'Ingreso';
    else if (expense > 0) transactionType = 'Egreso';
    else transactionType = 'Sin movimiento';

    return {
      id: cash.id,
      income,
      expense,
      date: cash.date,
      time_transaction: cash.time_transaction,
      balance: cash.balance || 0,
      details: cash.details,
      formattedIncome: this.formatCurrency(income),
      formattedExpense: this.formatCurrency(expense),
      formattedBalance: this.formatCurrency(cash.balance || 0),
      formattedDate: this.formatDate(cash.date),
      formattedTime: cash.time_transaction || 'N/A',
      transactionType,
    };
  }

  private formatCurrency(amount: number): string {
    if (isNaN(amount) || amount === 0) {
      return '-';
    }
    return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatDate(date?: string): string {
    if (!date) return 'Sin fecha';
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) 
      ? date 
      : parsed.toLocaleDateString('es-AR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en CashesListComponent:', error);
    const message =
      (error.error && (error.error.detail as string)) || error.message || defaultMessage;
    this.error.set(message);
    this.notificationService.error(message);
  }
}