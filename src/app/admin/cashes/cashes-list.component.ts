import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { DataTableComponent, DataTableActionsConfig, TableColumn } from '../../shared/data-table/data-table.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { LoggerService } from '../../services/core/logger.service';
import { NotificationService } from '../../core/notification';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentRead, PaymentStatus, PaymentStatusUpdatePayload } from '../../services/interfaces/payment.interfaces';
import { PaymentsService } from '../../services/payments/payments.service';

interface PaymentRow extends PaymentRead {
  amount_total?: number | null;
  gateway_metadata?: Record<string, unknown> | null;
  formattedAmount: string;
  formattedAmountTotal: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

type StatusFormValues = {
  status: PaymentStatus;
  payment_url?: string | null;
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
    ban: false,
    unban: false,
    download: false,
  };

  payments = signal<PaymentRow[]>([]);
  loading = signal(false);
  formLoading = signal(false);
  error = signal<string | null>(null);
  showStatusForm = signal(false);
  statusFormMode = signal<'edit'>('edit');
  selectedPayment = signal<PaymentRow | null>(null);
  viewDialogOpen = signal(false);
  viewDialogData: Partial<PaymentRow> = {};
  viewDialogTitle = signal('');

  statusFilter = signal<'all' | PaymentStatus>('all');
  userFilter = signal('');

  readonly filteredPayments = computed<PaymentRow[]>(() => {
    const user = this.userFilter().trim().toLowerCase();
    const status = this.statusFilter();

    return this.payments().filter((payment) => {
      const matchesUser = user
        ? (payment.user_id ?? '').toLowerCase().includes(user)
        : true;
      const matchesStatus =
        status === 'all' ? true : payment.status === status;
      return matchesUser && matchesStatus;
    });
  });

  readonly headerActions: ActionButton[] = [
    {
      label: 'Refrescar',
      icon: 'refresh',
      ariaLabel: 'Actualizar lista de pagos',
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
    { key: 'formattedAmountTotal', label: 'Monto total' },
    { key: 'payment_url', label: 'Link de pago' },
    { key: 'formattedCreatedAt', label: 'Creado' },
    { key: 'formattedUpdatedAt', label: 'Actualizado' },
  ];

  readonly viewDialogColumns: ViewDialogColumn[] = [
    { key: 'id', label: 'ID de Pago' },
    { key: 'status', label: 'Estado', format: (value: string) => this.formatStatus(value) },
    { key: 'formattedAmountTotal', label: 'Monto total' },
    { key: 'formattedAmount', label: 'Monto informado' },
    { key: 'currency', label: 'Moneda' },
    { key: 'turn_id', label: 'Turno asociado' },
    { key: 'appointment_id', label: 'Cita asociada' },
    { key: 'user_id', label: 'Usuario' },
    { key: 'payment_method', label: 'Método de pago' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'external_id', label: 'ID externo' },
    { key: 'payment_url', label: 'URL de pago' },
    { key: 'receipt_url', label: 'Comprobante' },
    { key: 'gateway_metadata', label: 'Metadata de gateway', format: (value) => this.formatMetadata(value) },
    { key: 'metadata', label: 'Metadata interna', format: (value) => this.formatMetadata(value) },
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
    if (this.userFilter().trim()) {
      params['user_id'] = this.userFilter().trim();
    }

    this.paymentsService.list(params).subscribe({
      next: (payments) => {
        const mapped = payments.map((payment) => this.mapPaymentToRow(payment));
        this.payments.set(mapped);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los pagos');
        this.loading.set(false);
      },
    });
  }

  onEdit(payment: PaymentRow): void {
    this.statusFormMode.set('edit');
    this.selectedPayment.set(payment);
    this.showStatusForm.set(true);
    this.statusFormInitialData = {
      status: payment.status,
      payment_url: payment.payment_url ?? '',
      metadata: payment.metadata ? JSON.stringify(payment.metadata) : '',
    };
  }

  onView(payment: PaymentRow): void {
    this.viewDialogData = payment;
    this.viewDialogTitle.set(`Pago ${payment.id}`);
    this.viewDialogOpen.set(true);
  }

  onDelete(payment: PaymentRow): void {
    const confirmed = confirm(`¿Eliminar el pago ${payment.id}?`);
    if (!confirmed) return;

    this.loading.set(true);
    this.paymentsService.delete(payment.id).subscribe({
      next: () => {
        this.notificationService.success('Pago eliminado correctamente');
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al eliminar el pago');
        this.loading.set(false);
      },
    });
  }

  onStatusFormSubmit(formData: StatusFormValues): void {
    this.formLoading.set(true);
    this.error.set(null);

    const paymentId = this.selectedPayment()?.id;
    if (!paymentId) {
      this.notificationService.error('No se encontró el pago a actualizar.');
      this.formLoading.set(false);
      return;
    }

    const metadata = this.parseMetadata(formData.metadata);
    if (metadata instanceof Error) {
      this.notificationService.error('El metadato debe ser un JSON válido.');
      this.formLoading.set(false);
      return;
    }

    const payload: PaymentStatusUpdatePayload = {
      status: formData.status,
      payment_url: formData.payment_url ?? null,
      metadata: metadata,
    };

    this.paymentsService.updateStatus(paymentId, payload).subscribe({
      next: (payment) => {
        this.notificationService.success('Estado del pago actualizado');
        this.logger.info('Pago actualizado', payment);
        this.formLoading.set(false);
        this.showStatusForm.set(false);
        this.selectedPayment.set(null);
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al actualizar el pago');
        this.formLoading.set(false);
      },
    });
  }

  onFormCancel(): void {
    this.showStatusForm.set(false);
    this.selectedPayment.set(null);
    this.statusFormInitialData = null;
  }

  closeViewDialog(): void {
    this.viewDialogOpen.set(false);
    this.viewDialogData = {};
  }

  onFiltersChange(): void {
    this.loadData();
  }

  get statusFormFields(): FormField<StatusFormValues>[] {
    return [
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        required: true,
        options: this.defaultStatuses.map((status) => ({
          value: status,
          label: this.formatStatus(status),
        })),
        validators: [Validators.required],
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
        placeholder: '{"origen": "panel-admin"}',
      },
    ];
  }

  statusFormInitialData: Partial<StatusFormValues> | null = null;

  private mapPaymentToRow(payment: PaymentRead): PaymentRow {
    const amountTotal = (payment as PaymentRow).amount_total ?? payment.amount;
    return {
      ...payment,
      amount_total: amountTotal,
      gateway_metadata: (payment as PaymentRow).gateway_metadata ?? null,
      formattedAmount: this.formatAmount(payment.amount, payment.currency),
      formattedAmountTotal: this.formatAmount(amountTotal, payment.currency),
      formattedCreatedAt: this.formatDate(payment.created_at),
      formattedUpdatedAt: this.formatDate(payment.updated_at),
    };
  }

  private formatAmount(amount: number | null | undefined, currency: string): string {
    if (amount == null || isNaN(Number(amount))) {
      return 'N/A';
    }
    return `${currency ?? ''} ${Number(amount).toFixed(2)}`.trim();
  }

  public formatStatus(status: string | PaymentStatus): string {
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
      : parsed.toLocaleString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  private formatMetadata(value: unknown): string {
    if (!value) return 'N/A';
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      this.logger.warn('No se pudo formatear el metadata del pago', error);
      return 'Metadata no disponible';
    }
  }

  private parseMetadata(value?: string): Record<string, unknown> | null | Error {
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
