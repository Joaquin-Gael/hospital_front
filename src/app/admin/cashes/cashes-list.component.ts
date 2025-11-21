import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { DataTableComponent, DataTableActionsConfig, TableColumn } from '../../shared/data-table/data-table.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { EntityFormComponent, EntityFormPayload, FormField } from '../../shared/entity-form/entity-form.component';
import { LoggerService } from '../../services/core/logger.service';
import { NotificationService } from '../../core/notification';
import { HttpErrorResponse } from '@angular/common/http';
import {
  PaymentCreatePayload,
  PaymentMethod,
  PaymentRead,
  PaymentStatus,
  PaymentStatusUpdatePayload,
} from '../../services/interfaces/payment.interfaces';
import { PaymentsService } from '../../services/payments/payments.service';

interface PaymentRow extends PaymentRead {
  formattedAmount: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

type PaymentFormValues = EntityFormPayload & {
  id?: string;
  turn_id: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  payment_method?: PaymentMethod | '';
  payment_url?: string | null;
  success_url: string;
  cancel_url: string;
  metadata?: string;
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
  private readonly paymentsService = inject(PaymentsService);
  private readonly logger = inject(LoggerService);
  private readonly notificationService = inject(NotificationService);

  readonly defaultStatuses = [
    PaymentStatus.PENDING,
    PaymentStatus.REQUIRES_ACTION,
    PaymentStatus.SUCCEEDED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELED,
  ];
  readonly tableActions: DataTableActionsConfig = {
    delete: false,
    ban: false,
    unban: false,
    download: false,
  };

  cashes = signal<PaymentRow[]>([]);
  loading = signal(false);
  formLoading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  selectedCash = signal<PaymentRow | null>(null);
  viewDialogOpen = signal(false);
  viewDialogData: Partial<PaymentRow> = {};
  viewDialogTitle = signal('');

  // Filtros adaptados
  transactionTypeFilter = signal<'all' | 'income' | 'expense'>('all');
  dateFilter = signal('');

  readonly filteredCashes = computed<PaymentRow[]>(() => {
    const turn = this.turnFilter().trim().toLowerCase();
    const user = this.userFilter().trim().toLowerCase();
    const status = this.statusFilter();

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
    { key: 'turn_id', label: 'Turno' },
    { key: 'user_id', label: 'Usuario' },
    { key: 'status', label: 'Estado', format: (value: string) => this.formatStatus(value) },
    { key: 'payment_method', label: 'Método de pago' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'formattedAmount', label: 'Monto' },
    { key: 'currency', label: 'Moneda' },
    { key: 'formattedCreatedAt', label: 'Creado' },
  ];

  readonly viewDialogColumns: ViewDialogColumn[] = [
    { key: 'id', label: 'ID de Pago' },
    { key: 'status', label: 'Estado', format: (value: string) => this.formatStatus(value) },
    { key: 'formattedAmount', label: 'Monto' },
    { key: 'currency', label: 'Moneda' },
    { key: 'turn_id', label: 'Turno asociado' },
    { key: 'appointment_id', label: 'Cita asociada' },
    { key: 'user_id', label: 'Usuario' },
    { key: 'payment_method', label: 'Método de pago' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'external_id', label: 'ID externo' },
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

    this.paymentsService.list(params).subscribe({
      next: (payments) => {
        const mapped = payments.map((payment) => this.mapPaymentToRow(payment));
        this.cashes.set(mapped);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los pagos');
        this.loading.set(false);
      },
    });
  }

  onAddNew(): void {
    this.formMode.set('create');
    this.selectedCash.set(null);
    this.showForm.set(true);
    this.formInitialData = {
      status: (this.statusOptions()[0] as PaymentStatus) ?? PaymentStatus.PENDING,
      currency: 'ARS',
    };
  }

  onEdit(cash: PaymentRow): void {
    this.formMode.set('edit');
    this.selectedCash.set(cash);
    this.showForm.set(true);
    this.formInitialData = {
      turn_id: cash.turn_id,
      amount: cash.amount,
      currency: cash.currency,
      status: cash.status as PaymentStatus,
      payment_url: cash.payment_url ?? '',
      payment_method: cash.payment_method ?? '',
      success_url: '',
      cancel_url: '',
      metadata: cash.metadata ? JSON.stringify(cash.metadata) : '',
    };
  }

  onView(cash: PaymentRow): void {
    this.viewDialogData = cash;
    this.viewDialogTitle.set(`Pago ${cash.id}`);
    this.viewDialogOpen.set(true);
  }

  onFormSubmit(formData: PaymentFormValues): void {
    this.formLoading.set(true);
    this.error.set(null);

    const amount = Number(formData.amount);
    const metadata = this.parseMetadata(formData.metadata);
    if (metadata instanceof Error) {
      this.notificationService.error('El metadato debe ser un JSON válido.');
      this.formLoading.set(false);
      return;
    }

    if (this.formMode() === 'create') {
      const payload: PaymentCreatePayload = {
        turn_id: formData.turn_id,
        amount,
        currency: formData.currency,
        success_url: formData.success_url,
        cancel_url: formData.cancel_url,
        payment_method: formData.payment_method || undefined,
        metadata: metadata || undefined,
      };

      this.paymentsService.create(payload).subscribe({
        next: (payment) => {
          this.notificationService.success('Pago creado correctamente');
          this.logger.info('Pago guardado', payment);
          this.formLoading.set(false);
          this.showForm.set(false);
          this.selectedCash.set(null);
          this.loadData();
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'Error al crear el pago');
          this.formLoading.set(false);
        },
      });
      return;
    }

    const paymentId = this.selectedCash()?.id;
    if (!paymentId) {
      this.notificationService.error('No se encontró el pago a actualizar.');
      this.formLoading.set(false);
      return;
    }

    const payload: PaymentStatusUpdatePayload = {
      status: formData.status,
      payment_url: formData.payment_url ?? null,
      metadata: metadata || null,
    };

    this.paymentsService.updateStatus(paymentId, payload).subscribe({
      next: (payment) => {
        this.notificationService.success('Pago actualizado correctamente');
        this.logger.info('Pago actualizado', payment);
        this.formLoading.set(false);
        this.showForm.set(false);
        this.selectedCash.set(null);
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al actualizar el pago');
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

  get formFields(): FormField<PaymentFormValues>[] {
    const baseFields: FormField<PaymentFormValues>[] = [
      {
        key: 'turn_id',
        label: 'ID de turno',
        type: 'text',
        required: true,
        validators: [Validators.required],
        readonly: this.formMode() === 'edit',
      },
      {
        key: 'amount',
        label: 'Monto',
        type: 'number',
        required: true,
        validators: [Validators.required, Validators.min(0)],
        readonly: this.formMode() === 'edit',
      },
      {
        key: 'currency',
        label: 'Moneda',
        type: 'text',
        required: true,
        validators: [Validators.required, Validators.maxLength(5)],
        placeholder: 'Ej: ARS, USD',
        readonly: this.formMode() === 'edit',
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
        key: 'payment_method',
        label: 'Método de pago',
        type: 'select',
        required: false,
        options: [
          { value: '', label: 'No especificado' },
          { value: PaymentMethod.CARD, label: 'Tarjeta' },
          { value: PaymentMethod.CASH, label: 'Efectivo' },
          { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
          { value: PaymentMethod.PIX, label: 'Pix' },
          { value: PaymentMethod.OTHER, label: 'Otro' },
        ],
      },
      {
        key: 'payment_url',
        label: 'URL de pago',
        type: 'text',
        required: false,
      },
      {
        key: 'metadata',
        label: 'Metadata (JSON)',
        type: 'textarea',
        required: false,
        validators: [Validators.maxLength(1000)],
        placeholder: '{"orderId": "123"}',
      },
    ];

    if (this.formMode() === 'create') {
      baseFields.splice(3, 0,
        {
          key: 'success_url',
          label: 'URL de éxito',
          type: 'text',
          required: true,
          validators: [Validators.required],
        },
        {
          key: 'cancel_url',
          label: 'URL de cancelación',
          type: 'text',
          required: true,
          validators: [Validators.required],
        }
      );
    }

    return baseFields;
  }

  formInitialData: Partial<PaymentFormValues> | null = null;

  private mapPaymentToRow(payment: PaymentRead): PaymentRow {
    return {
      ...payment,
      formattedAmount: this.formatAmount(payment.amount, payment.currency),
      formattedCreatedAt: this.formatDate(payment.created_at),
      formattedUpdatedAt: this.formatDate(payment.updated_at),
    };
  }

  private refreshStatusOptions(cashes: PaymentRow[]): void {
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

  private formatStatus(status: string | PaymentStatus): string {
    if (!status) return 'Desconocido';
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
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

  private parseMetadata(value?: string): Record<string, unknown> | Error | null {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.warn('No se pudo parsear el metadata del pago', error);
      return error instanceof Error ? error : new Error('Invalid metadata JSON');
    }
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en CashesListComponent:', error);
    const message =
      (error.error && (error.error.detail as string)) || error.message || defaultMessage;
    this.error.set(message);
    this.notificationService.error(message);
  }
}