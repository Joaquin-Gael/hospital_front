import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { HealthInsuranceService } from '../../services/health_insarunce/health-insurance.service';
import { LoggerService } from '../../services/core/logger.service';
import {
  HealthInsuranceRead,
  HealthInsuranceCreate,
  HealthInsuranceUpdate,
} from '../../services/interfaces/health-insurance.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

interface ExtendedHealthInsurance extends HealthInsuranceRead {
  isActive?: boolean;
}

interface HealthInsuranceFormData {
  name: string;
  description?: string;
  discount: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-health-insurance-list',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    ViewDialogComponent,
    DataTableComponent,
    EntityFormComponent,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './health-insurance-list.component.html',
  styleUrls: ['./health-insurance-list.component.scss'],
})
export class HealthInsuranceListComponent implements OnInit {
  private service = inject(HealthInsuranceService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  insurances: ExtendedHealthInsurance[] = [];
  selectedInsurance: ExtendedHealthInsurance | null = null;
  loading = false;
  formLoading = false;
  error: string | null = null;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';

  // View dialog
  viewDialogOpen = false;
  viewDialogData: any = {};
  viewDialogTitle = '';

  headerActions: ActionButton[] = [
    {
      label: 'Nueva Obra Social',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nueva obra social',
      onClick: () => this.onAddNew()
    }
  ];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'discount', label: 'Descuento (%)', format: (value: number) => `${value}%` },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'discount', label: 'Descuento (%)', format: (value: number) => `${value}%` },
    { key: 'isActive', label: 'Activo', format: (value?: boolean) => value ? 'Sí' : 'No' },
  ];

  formFields: FormField[] = [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
    },
    {
      key: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: false,
      validators: [Validators.maxLength(500)]
    },
    {
      key: 'discount',
      label: 'Descuento (%)',
      type: 'number',
      required: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)]
    },
    {
      key: 'isActive',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    },
  ];

  ngOnInit(): void {
    this.loadInsurances();
  }

  loadInsurances(): void {
    this.loading = true;
    this.error = null;

    this.service.getAll().subscribe({
      next: (insurances) => {
        this.insurances = insurances.map((insurance: HealthInsuranceRead) => ({
          ...insurance,
          isActive: true, // Valor por en efecto 🗿🚬
        }));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar las obras sociales');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedInsurance = null;
    this.showForm = true;
    this.logger.debug('Opening form for new health insurance');
  }

  onEdit(insurance: ExtendedHealthInsurance): void {
    this.formMode = 'edit';
    this.selectedInsurance = insurance;
    this.showForm = true;
    this.logger.debug('Opening form for editing health insurance', insurance);
  }

  onView(insurance: ExtendedHealthInsurance): void {
    this.viewDialogData = insurance;
    this.viewDialogTitle = `Obra Social: ${insurance.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for health insurance', insurance);
  }

  onDelete(insurance: ExtendedHealthInsurance): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { 
        title: 'Eliminar Obra Social', 
        message: `¿Está seguro de eliminar la obra social "${insurance.name}"?` 
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;

        this.service.delete(insurance.id).subscribe({
          next: () => {
            this.insurances = this.insurances.filter((i) => i.id !== insurance.id);
            this.loading = false;
            this.logger.info(`Obra social "${insurance.name}" eliminada correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar la obra social "${insurance.name}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onFormSubmit(formData: HealthInsuranceFormData): void {
    this.formLoading = true;
    this.error = null;

    const { isActive, ...insuranceData } = formData;

    const request = this.formMode === 'create'
      ? this.service.create(insuranceData as HealthInsuranceCreate)
      : this.service.update(this.selectedInsurance!.id, insuranceData as HealthInsuranceUpdate);

    request.subscribe({
      next: (result: HealthInsuranceRead) => {
        this.formLoading = false;
        this.showForm = false;
        this.loadInsurances();
        this.logger.info(`Obra social ${this.formMode === 'create' ? 'creada' : 'actualizada'} correctamente`);
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        this.handleError(error, `Error al ${this.formMode === 'create' ? 'crear' : 'actualizar'} la obra social`);
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedInsurance = null;
    this.logger.debug('Form cancelled');
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en HealthInsuranceListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}