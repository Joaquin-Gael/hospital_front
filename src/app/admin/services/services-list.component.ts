import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { ServiceService } from '../../services/service/service.service';
import { LoggerService } from '../../services/core/logger.service';
import {
  Service,
  ServiceCreate,
  ServiceUpdate,
} from '../../services/interfaces/hospital.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

interface ExtendedService extends Service {
  isActive?: boolean;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  specialty_id: string;
  icon_code: string;
  duration?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-service-list',
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
    MatButtonModule,
  ],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.scss'],
})
export class ServiceListComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  services: ExtendedService[] = [];
  selectedService: ExtendedService | null = null;
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
      label: 'Nuevo Servicio',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nuevo servicio',
      onClick: () => this.onAddNew()
    }
  ];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    {
      key: 'price',
      label: 'Precio',
      format: (value: number) => `$${value.toFixed(2)}`,
    },
    { key: 'icon_code', label: 'Icono' },
    { key: 'specialty_id', label: 'ID de Especialidad' },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    {
      key: 'price',
      label: 'Precio',
      format: (value: number) => `$${value.toFixed(2)}`,
    },
    { key: 'icon_code', label: 'Icono' },
    { key: 'specialty_id', label: 'ID de Especialidad' },
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
      required: true,
      validators: [Validators.required, Validators.maxLength(500)]
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      required: true,
      validators: [Validators.required, Validators.min(0)]
    },
    {
      key: 'icon_code',
      label: 'Icono',
      type: 'text',
      required: true,
      validators: [Validators.required]
    },
    {
      key: 'specialty_id',
      label: 'ID de Especialidad',
      type: 'text',
      required: true,
      validators: [Validators.required]
    },
    {
      key: 'isActive',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true
    },
  ];

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.error = null;

    this.serviceService.getServices().subscribe({
      next: (services) => {
        this.services = services.map((service: Service) => ({
          ...service,
          isActive: true, // Valor por defecto
        }));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los servicios');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedService = null;
    this.showForm = true;
    this.logger.debug('Opening form for new service');
  }

  onEdit(service: ExtendedService): void {
    this.formMode = 'edit';
    this.selectedService = service;
    this.showForm = true;
    this.logger.debug('Opening form for editing service', service);
  }

  onView(service: ExtendedService): void {
    this.viewDialogData = service;
    this.viewDialogTitle = `Servicio: ${service.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for service', service);
  }

  onDelete(service: ExtendedService): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Servicio',
        message: `¿Está seguro de eliminar el servicio "${service.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;

        this.serviceService.deleteService(service.id.toString()).subscribe({
          next: () => {
            this.services = this.services.filter((s) => s.id !== service.id);
            this.loading = false;
            this.logger.info(`Servicio "${service.name}" eliminado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar el servicio "${service.name}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onFormSubmit(formData: ServiceFormData): void {
    this.formLoading = true;
    this.error = null;

    const { duration, isActive, ...serviceData } = formData;

    const request = this.formMode === 'create'
      ? this.serviceService.createService(serviceData as ServiceCreate)
      : this.serviceService.updateService(this.selectedService!.id.toString(), serviceData as ServiceUpdate);

    request.subscribe({
      next: (result: Service) => {
        this.formLoading = false;
        this.showForm = false;
        this.loadServices();
        this.logger.info(`Servicio ${this.formMode === 'create' ? 'creado' : 'actualizado'} correctamente`);
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        this.handleError(error, `Error al ${this.formMode === 'create' ? 'crear' : 'actualizar'} el servicio`);
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedService = null;
    this.logger.debug('Form cancelled');
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en ServiceListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}