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
import { CashesDetailsRead } from '../../services/interfaces/cashes.interfaces';
import { HttpErrorResponse } from '@angular/common/http';

interface CashRow extends CashesDetailsRead {
  formattedAmount: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  is_active?: boolean;
}

type CashFormValues = EntityFormPayload & {
  id?: string;
  turn_id: string;
  user_id: string;
  appointment_id?: string | null;
  amount: number | string;
  currency: string;
  status: string;
  payment_url?: string | null;
  description?: string | null;
  receipt_url?: string | null;
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

  readonly defaultStatuses = ['pending', 'paid', 'failed', 'cancelled'];
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

  statusFilter = signal<'all' | string>('all');
  turnFilter = signal('');
  userFilter = signal('');
  statusOptions = signal<string[]>([...this.defaultStatuses]);

  readonly filteredCashes = computed<CashRow[]>(() => {
    const turn = this.turnFilter().trim().toLowerCase();
    const user = this.userFilter().trim().toLowerCase();
    const status = this.statusFilter();

    return this.cashes().filter((cash) => {
      const matchesTurn = turn ? cash.turn_id?.toLowerCase().includes(turn) : true;
      const matchesUser = user ? cash.user_id?.toLowerCase().includes(user) : true;
      const matchesStatus =
        status === 'all' ? true : cash.status?.toLowerCase() === status.toLowerCase();

      return matchesTurn && matchesUser && matchesStatus;
    });
  });

  readonly headerActions: ActionButton[] = [
    {
      label: 'Nueva cobranza',
      icon: 'add',
      ariaLabel: 'Crear nuevo registro de cobranza',
      variant: 'primary',
      onClick: () => this.onAddNew(),
    },
    {
      label: 'Refrescar',
      icon: 'refresh',
      ariaLabel: 'Actualizar lista de cobranzas',
      variant: 'secondary',
      onClick: () => this.loadData(),
    },
  ];

  readonly tableColumns: TableColumn[] = [
    { key: 'id', label: '#ID' },
    { key: 'turn_id', label: 'Turno' },
    { key: 'user_id', label: 'Usuario' },
    { key: 'status', label: 'Estado', format: (value: string) => this.formatStatus(value) },
    { key: 'formattedAmount', label: 'Monto' },
    { key: 'currency', label: 'Moneda' },
    { key: 'formattedCreatedAt', label: 'Creado' },
  ];

  readonly viewDialogColumns: ViewDialogColumn[] = [
    { key: 'id', label: 'ID de Cobranza' },
    { key: 'status', label: 'Estado', format: (value: string) => this.formatStatus(value) },
    { key: 'formattedAmount', label: 'Monto' },
    { key: 'currency', label: 'Moneda' },
    { key: 'turn_id', label: 'Turno asociado' },
    { key: 'appointment_id', label: 'Cita asociada' },
    { key: 'user_id', label: 'Usuario' },
    { key: 'payment_url', label: 'URL de pago' },
    { key: 'receipt_url', label: 'Comprobante' },
    { key: 'description', label: 'Descripción' },
    { key: 'formattedCreatedAt', label: 'Creado' },
    { key: 'formattedUpdatedAt', label: 'Actualizado' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.statusFilter() !== 'all') {
      params['status'] = this.statusFilter();
    }
    if (this.turnFilter().trim()) {
      params['turn_id'] = this.turnFilter().trim();
    }
    if (this.userFilter().trim()) {
      params['user_id'] = this.userFilter().trim();
    }

    this.cashesService.getCashes(params).subscribe({
      next: (cashes) => {
        const mapped = cashes.map((cash) => this.mapCashToRow(cash));
        this.cashes.set(mapped);
        this.refreshStatusOptions(mapped);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar las cobranzas');
        this.loading.set(false);
      },
    });
  }

  onAddNew(): void {
    this.formMode.set('create');
    this.selectedCash.set(null);
    this.showForm.set(true);
    this.formInitialData = {
      status: this.statusOptions()[0] ?? 'pending',
      currency: 'ARS',
    };
  }

  onEdit(cash: CashRow): void {
    this.formMode.set('edit');
    this.selectedCash.set(cash);
    this.showForm.set(true);
    this.formInitialData = {
      turn_id: cash.turn_id,
      user_id: cash.user_id,
      appointment_id: cash.appointment_id ?? '',
      amount: cash.amount,
      currency: cash.currency,
      status: cash.status,
      payment_url: cash.payment_url ?? '',
      description: cash.description ?? '',
      receipt_url: cash.receipt_url ?? '',
    };
  }

  onView(cash: CashRow): void {
    this.viewDialogData = cash;
    this.viewDialogTitle.set(`Cobranza ${cash.id}`);
    this.viewDialogOpen.set(true);
  }

  onFormSubmit(formData: CashFormValues): void {
    this.formLoading.set(true);
    this.error.set(null);

    const amount = Number(formData.amount);
    const payload = {
      ...formData,
      amount,
      id: this.formMode() === 'edit' ? this.selectedCash()?.id : undefined,
    };

    this.cashesService.createOrUpdateCash(payload).subscribe({
      next: (cash) => {
        this.notificationService.success(
          this.formMode() === 'create'
            ? 'Cobranza creada correctamente'
            : 'Cobranza actualizada correctamente'
        );
        this.logger.info('Cobranza guardada', cash);
        this.formLoading.set(false);
        this.showForm.set(false);
        this.selectedCash.set(null);
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(
          error,
          this.formMode() === 'create'
            ? 'Error al crear la cobranza'
            : 'Error al actualizar la cobranza'
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

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status as 'all' | string);
    this.loadData();
  }

  onTurnFilterChange(turn: string): void {
    this.turnFilter.set(turn);
  }

  onUserFilterChange(user: string): void {
    this.userFilter.set(user);
  }

  applyFilters(): void {
    this.loadData();
  }

  resetFilters(): void {
    this.statusFilter.set('all');
    this.turnFilter.set('');
    this.userFilter.set('');
    this.loadData();
  }

  closeViewDialog(): void {
    this.viewDialogOpen.set(false);
    this.viewDialogData = {};
  }

  get formFields(): FormField<CashFormValues>[] {
    return [
      {
        key: 'turn_id',
        label: 'ID de turno',
        type: 'text',
        required: true,
        validators: [Validators.required],
        readonly: this.formMode() === 'edit',
      },
      {
        key: 'user_id',
        label: 'ID de usuario',
        type: 'text',
        required: true,
        validators: [Validators.required],
        readonly: this.formMode() === 'edit',
      },
      {
        key: 'appointment_id',
        label: 'ID de cita (opcional)',
        type: 'text',
        required: false,
      },
      {
        key: 'amount',
        label: 'Monto',
        type: 'number',
        required: true,
        validators: [Validators.required, Validators.min(0)],
      },
      {
        key: 'currency',
        label: 'Moneda',
        type: 'text',
        required: true,
        validators: [Validators.required, Validators.maxLength(5)],
        placeholder: 'Ej: ARS, USD',
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        required: true,
        options: this.statusOptions().map((status) => ({
          value: status,
          label: this.formatStatus(status),
        })),
      },
      {
        key: 'payment_url',
        label: 'URL de pago',
        type: 'text',
        required: false,
      },
      {
        key: 'receipt_url',
        label: 'URL de comprobante',
        type: 'text',
        required: false,
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        required: false,
        validators: [Validators.maxLength(500)],
      },
    ];
  }

  formInitialData: Partial<CashFormValues> | null = null;

  private mapCashToRow(cash: CashesDetailsRead): CashRow {
    return {
      ...cash,
      formattedAmount: this.formatAmount(cash.amount, cash.currency),
      formattedCreatedAt: this.formatDate(cash.created_at),
      formattedUpdatedAt: this.formatDate(cash.updated_at),
    };
  }

  private refreshStatusOptions(cashes: CashRow[]): void {
    const statuses = new Set<string>(this.defaultStatuses);
    cashes.forEach((cash) => {
      if (cash.status) {
        statuses.add(cash.status);
      }
    });
    this.statusOptions.set(Array.from(statuses));
  }

  private formatAmount(amount: number, currency: string): string {
    if (isNaN(amount)) {
      return 'N/A';
    }
    return `${currency ?? ''} ${amount.toFixed(2)}`.trim();
  }

  private formatStatus(status: string): string {
    if (!status) return 'Desconocido';
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
  }

  private formatDate(date?: string): string {
    if (!date) return 'Sin fecha';
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? date : parsed.toLocaleString();
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en CashesListComponent:', error);
    const message =
      (error.error && (error.error.detail as string)) || error.message || defaultMessage;
    this.error.set(message);
    this.notificationService.error(message);
  }
}
