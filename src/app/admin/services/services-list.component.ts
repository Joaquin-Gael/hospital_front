import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import {
  EntityFormComponent,
  FormField,
} from '../../shared/entity-form/entity-form.component';
import { ServiceService } from '../../services/service/service.service';
import {
  Service,
  ServiceCreate,
  ServiceUpdate,
} from '../../services/interfaces/hospital.interfaces';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

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
  loading: boolean = false;
  showForm: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedService: ExtendedService | null = null;
  formLoading: boolean = false;
  error: string | null = null;

  tableColumns = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    {
      key: 'price',
      label: 'Precio',
      format: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      key: 'isActive',
      label: 'Activo',
      format: (value?: boolean) => (value ? 'Sí' : 'No'),
    },
  ];

  formFields: FormField[] = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    {
      key: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: true,
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      required: true,
      validators: [Validators.min(0)],
    },
    {
      key: 'icon_code',
      label: 'Icono',
      type: 'text',
      required: true,
    },
    {
      key: 'specialty_id',
      label: 'ID de Especialidad',
      type: 'text',
      required: true,
    },
    { key: 'isActive', label: 'Activo', type: 'checkbox', defaultValue: true },
  ];

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.error = null;

    this.serviceService.getServices().subscribe({
      next: (services) => {
        this.services = services.map((s) => ({
          ...s,
          duration: undefined,
          isActive: true,
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
  }

  onEdit(service: ExtendedService): void {
    this.formMode = 'edit';
    this.selectedService = service;
    this.showForm = true;
  }

  onDelete(service: ExtendedService): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Servicio',
        message: `¿Está seguro de eliminar el servicio "${service.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;

        this.serviceService.deleteService(service.id.toString()).subscribe({
          next: () => {
            this.services = this.services.filter((s) => s.id !== service.id);
            this.loading = false;
            this.logger.info(
              `Servicio "${service.name}" eliminado correctamente`
            );
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al eliminar el servicio "${service.name}"`
            );
            this.loading = false;
          },
        });
      }
    });
  }

  onView(service: ExtendedService): void {
    alert(
      `Detalles del servicio: ${service.name}\nDescripción: ${
        service.description
      }\nPrecio: $${service.price.toFixed(2)}\nActivo: ${
        service.isActive ? 'Sí' : 'No'
      }`
    );
  }

  onFormSubmit(formData: ServiceFormData): void {
    this.formLoading = true;
    this.error = null;
    const { duration, isActive, ...serviceData } = formData;
    if (this.formMode === 'create') {
      this.serviceService
        .createService(serviceData as ServiceCreate)
        .subscribe({
          next: (newService) => {
            console.log('Respuesta del backend al crear servicio:', newService); 
            this.services.push({
              ...newService,
              isActive: isActive !== undefined ? isActive : true,
            });
            this.formLoading = false;
            this.showForm = false;
            this.logger.info(
              `Servicio "${newService.name}" creado correctamente`
            );
          },
          error: (error: HttpErrorResponse) => {
            console.log('Error detallado al crear servicio:', error);
            this.handleError(error, 'Error al crear el servicio');
            this.formLoading = false;
          },
        });
    } else {
      if (!this.selectedService) return;

      this.serviceService
        .updateService(
          this.selectedService.id.toString(),
          serviceData as ServiceUpdate
        )
        .subscribe({
          next: (updatedService) => {
            const index = this.services.findIndex(
              (s) => s.id === updatedService.id
            );
            if (index !== -1) {
              this.services[index] = {
                ...updatedService,
                isActive:
                  isActive !== undefined
                    ? isActive
                    : this.services[index].isActive,
              };
            }
            this.formLoading = false;
            this.showForm = false;
            this.logger.info(
              `Servicio "${updatedService.name}" actualizado correctamente`
            );
          },
          error: (error: HttpErrorResponse) => {
            console.log('Error detallado al actualizar servicio:', error); 
            this.handleError(error, 'Error al actualizar el servicio');
            this.formLoading = false;
          },
        });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en ServiceListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}
