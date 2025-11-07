import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SectionHeaderComponent,
  ActionButton,
} from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import {
  ViewDialogComponent,
  ViewDialogColumn,
} from '../../shared/view-dialog/view-dialog.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../shared/data-table/data-table.component';
import {
  EntityFormComponent,
  EntityFormPayload,
  FormField,
} from '../../shared/entity-form/entity-form.component';
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
import { Specialty } from '../../services/interfaces/hospital.interfaces';
import { SpecialityService } from '../../services/speciality/speciality.service';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../../core/notification';

type ServiceFormValues = EntityFormPayload &
  ServiceCreate;

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
  private specialityService = inject(SpecialityService);
  private notificationService = inject(NotificationService);

  services: Service[] = [];
  specialities: Specialty[] = [];
  selectedService: Service | null = null;
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
      onClick: () => this.onAddNew(),
    },
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
    { key: 'associatedSpecialtyName', label: 'Especialidad' },
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
    { key: 'associatedSpecialtyName', label: 'Especialidad' },
  ];

  baseFormFields: FormField<ServiceFormValues>[] = [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
    },
    {
      key: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: true,
      validators: [Validators.required, Validators.maxLength(500)],
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      required: true,
      validators: [Validators.required, Validators.min(0)],
    },
    {
      key: 'icon_code',
      label: 'Icono',
      type: 'text',
      required: true,
      validators: [Validators.required],
    },
    {
      key: 'specialty_id',
      label: 'Especialidad',
      type: 'select',
      required: true,
      validators: [Validators.required],
    },
  ];

  get formFields(): FormField<ServiceFormValues>[] {
    if (this._formFields.length === 0 || this.formMode !== this.formMode) {
      this._formFields = this.baseFormFields.map((field) => ({
        ...field,
      }));
    }
    return this._formFields;
  }

  private _formFields: FormField<ServiceFormValues>[] = [];
  formInitialData: Partial<ServiceFormValues> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      specialities: this.specialityService.getSpecialities(),
      services: this.serviceService.getServices(),
    }).subscribe({
      next: (result) => {
        this.specialities = result.specialities;
        this.services = result.services.map((service) => {
          return {
            ...service,
            associatedSpecialtyName:
              this.specialities.find((s) => s.id === service.specialty_id)
                ?.name || 'Desconocida',
          };
        });
        const specialityFieldIndex = this.baseFormFields.findIndex(
          (f) => f.key === 'specialty_id'
        );
        if (specialityFieldIndex !== -1) {
          this.baseFormFields[specialityFieldIndex].options =
            this.specialities.map((s) => ({
              value: s.id.toString(),
              label: s.name,
            }));
          this.loading = false;
        }
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los datos');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedService = null;
    this.formInitialData = null;
    this.showForm = true;
    this.logger.debug('Opening form for new service');
  }

  onEdit(service: Service): void {
    this.formMode = 'edit';
    this.selectedService = service;
    this.formInitialData = {
      name: service.name ?? '',
      description: service.description ?? '',
      price: service.price,
      icon_code: service.icon_code ?? '',
      specialty_id: service.specialty_id,
    };
    this.showForm = true;
    this.logger.debug('Opening form for editing service', service);
  }

  onView(service: Service): void {
    this.viewDialogData = service;
    this.viewDialogTitle = `Servicio: ${service.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for service', service);
  }

  onDelete(service: Service): void {
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
            this.logger.info(
              `Servicio "${service.name}" eliminado correctamente`
            );
            this.notificationService.success('¡Servicio eliminado con éxito!', {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al eliminar el servicio "${service.name}"`
            );
            this.loading = false;
            this.notificationService.error(
              '¡Ocurrió un error al eliminar el servicio',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
          },
        });
      }
    });
  }

  onFormSubmit(formData: ServiceFormValues): void {
    this.formLoading = true;
    this.error = null;

    const price = Number(formData.price);

    const createPayload: ServiceCreate = {
      name: formData.name,
      description: formData.description ?? '',
      price,
      specialty_id: formData.specialty_id,
      icon_code: formData.icon_code ?? '',
    };

    const updatePayload: ServiceUpdate = {
      name: formData.name,
      description: formData.description ?? '',
      price,
      specialty_id: formData.specialty_id,
      icon_code: formData.icon_code ?? '',
    };

    const request =
      this.formMode === 'create'
        ? this.serviceService.createService(createPayload)
        : this.serviceService.updateService(
            this.selectedService!.id.toString(),
            updatePayload
          );

    request.subscribe({
      next: () => {
        this.formLoading = false;
        this.showForm = false;
        this.formInitialData = null;
        this.loadData();
        this.logger.info(
          `Servicio ${
            this.formMode === 'create' ? 'creado' : 'actualizado'
          } correctamente`
        );
        this.notificationService.success(
          `¡Servicio ${
            this.formMode === 'create' ? 'creado' : 'actualizado'
          } con éxito!`,
          {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          }
        );
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        this.handleError(
          error,
          `Error al ${
            this.formMode === 'create' ? 'crear' : 'actualizar'
          } el servicio`
        );
        this.notificationService.error(
          `¡Ocurrió un error al ${
            this.formMode === 'create' ? 'crear' : 'actualizar'
          } el servicio!`,
          {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          }
        );
      },
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedService = null;
    this.formInitialData = null;
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
