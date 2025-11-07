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
import { LocationService } from '../../services/location/location.service';
import { LoggerService } from '../../services/core/logger.service';
import {
  Location,
  LocationCreate,
  LocationUpdate,
} from '../../services/interfaces/hospital.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { NotificationService } from '../../core/notification';

interface ExtendedLocation extends Location {
  departmentCount?: number;
}

type LocationFormValues = EntityFormPayload & LocationCreate;

@Component({
  selector: 'app-location-list',
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
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
})
export class LocationListComponent implements OnInit {
  private locationService = inject(LocationService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  locations: ExtendedLocation[] = [];
  selectedLocation: ExtendedLocation | null = null;
  formInitialData: Partial<LocationFormValues> | null = null;
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
      label: 'Nueva Ubicación',
      icon: 'add_location',
      variant: 'primary',
      ariaLabel: 'Agregar nueva ubicación',
      onClick: () => this.onAddNew(),
    },
  ];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'id', label: 'ID de Ubicación' },
    {
      key: 'departmentCount',
      label: 'Número de Departamentos',
      format: (value: number) => (value || 0).toString(),
    },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'id', label: 'ID de Ubicación' },
    {
      key: 'departmentCount',
      label: 'Número de Departamentos',
      format: (value?: number) => (value || 0).toString(),
    },
  ];

  formFields: FormField<LocationFormValues>[] = [
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
      required: false,
      validators: [Validators.maxLength(500)],
    },
  ];

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.error = null;

    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.logger.debug('Datos recibidos en loadLocations', locations);
        this.locations = locations.map((l) => ({
          ...l,
          departmentCount: l.departments?.length || 0,
        }));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar las ubicaciones');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedLocation = null;
    this.formInitialData = null;
    this.showForm = true;
    this.logger.debug('Opening form for new location');
  }

  onEdit(location: ExtendedLocation): void {
    this.formMode = 'edit';
    this.selectedLocation = { ...location };
    this.formInitialData = {
      name: location.name,
      description: location.description,
    };
    this.showForm = true;
    this.logger.debug('Opening form for editing location', location);
  }

  onView(location: ExtendedLocation): void {
    this.viewDialogData = location;
    this.viewDialogTitle = `Ubicación: ${location.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for location', location);
  }

  onDelete(location: ExtendedLocation): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Ubicación',
        message: `¿Está seguro de eliminar la ubicación "${location.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;

        this.locationService.deleteLocation(location.id).subscribe({
          next: () => {
            this.locations = this.locations.filter((l) => l.id !== location.id);
            this.loading = false;
            this.notificationService.success(
              '¡Ubicación eliminada con éxito!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.logger.info(
              `Ubicación "${location.name}" eliminada correctamente`
            );
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al eliminar la ubicación "${location.name}"`
            );
            this.loading = false;
          },
        });
      }
    });
  }

  onFormSubmit(formData: LocationFormValues): void {
    this.formLoading = true;
    this.error = null;

    const createPayload: LocationCreate = {
      name: formData.name,
      description: formData.description ?? '',
    };

    const updatePayload: LocationUpdate = {
      name: formData.name,
      description: formData.description ?? '',
      location_id: this.selectedLocation?.id ?? '',
    };

    const request =
      this.formMode === 'create'
        ? this.locationService.addLocation(createPayload)
        : this.locationService.updateLocation(
            this.selectedLocation!.id,
            updatePayload
          );

    request.subscribe({
      next: (result: Location) => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedLocation = null;
        this.formInitialData = null;
        this.loadLocations();
        this.logger.info(
          `Ubicación ${
            this.formMode === 'create' ? 'creada' : 'actualizada'
          } correctamente`
        );
        this.notificationService.success(
          `¡Ubicación ${
            this.formMode === 'create' ? 'creada' : 'actualizada'
          } con éxito!`,
          {
            duration: 6000,
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
          } la ubicación`
        );
        this.notificationService.error(
          `¡Ocurrió un error al ${
            this.formMode === 'create' ? 'crear' : 'actualizar'
          } la ubicación!`,
          {
            duration: 8000,
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
    this.selectedLocation = null;
    this.formInitialData = null;
    this.logger.debug('Form cancelled');
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en LocationListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}
