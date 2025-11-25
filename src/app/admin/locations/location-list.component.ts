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
    {
      label: 'Refrescar',
      icon: 'refresh',
      variant: 'secondary',
      ariaLabel: 'Refrescar ubicaciones',
      onClick: () => this.loadLocations(),
    },
  ];

  // CORREGIDO: Agregado sortable y mejorado formato
  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción', sortable: true },
    { 
      key: 'departmentCount', 
      label: 'Departamentos', 
      sortable: true,
      format: (value: number) => value ? `${value} dept${value !== 1 ? 's' : ''}` : 'Sin departamentos'
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
      label: 'Nombre de la Ubicación',
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
        // Mapear ubicaciones con conteo de departamentos
        this.locations = locations.map((location) => ({
          ...location,
          departmentCount: location.departments?.length || 0,
        }));
        
        this.loading = false;
        this.logger.info('Ubicaciones cargadas correctamente', {
          count: this.locations.length,
        });
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
    this.error = null;
    this.logger.debug('Abriendo formulario para nueva ubicación');
  }

  onEdit(location: ExtendedLocation): void {
    this.formMode = 'edit';
    this.selectedLocation = { ...location };
    this.formInitialData = {
      name: location.name,
      description: location.description,
    };
    this.showForm = true;
    this.error = null;
    this.logger.debug('Editando ubicación', { id: location.id });
  }

  onView(location: ExtendedLocation): void {
    this.viewDialogData = location;
    this.viewDialogTitle = `Ubicación: ${location.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Visualizando ubicación', { id: location.id });
  }

  onDelete(location: ExtendedLocation): void {
    // MEJORADO: Validar si tiene departamentos asociados
    if (location.departmentCount && location.departmentCount > 0) {
      this.notificationService.warning(
        `No se puede eliminar la ubicación "${location.name}" porque tiene ${location.departmentCount} departamento${location.departmentCount !== 1 ? 's' : ''} asociado${location.departmentCount !== 1 ? 's' : ''}.`,
        {
          duration: 7000,
          action: {
            label: 'Entendido',
            action: () => this.notificationService.dismissAll(),
          },
        }
      );
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Ubicación',
        message: `¿Está seguro de eliminar la ubicación "${location.name}"? Esta acción no se puede deshacer.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loading = true;

        this.locationService.deleteLocation(location.id).subscribe({
          next: () => {
            // Actualizar lista local
            this.locations = this.locations.filter(
              (l) => l.id !== location.id
            );
            
            this.loading = false;
            this.notificationService.success(
              `Ubicación "${location.name}" eliminada correctamente`,
              {
                duration: 5000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            
            this.logger.info('Ubicación eliminada', {
              id: location.id,
              name: location.name,
            });
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

    const payload: LocationCreate = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
    };

    const request =
      this.formMode === 'create'
        ? this.locationService.addLocation(payload)
        : this.locationService.updateLocation(
            this.selectedLocation!.id,
            {
              ...payload,
              location_id: this.selectedLocation!.id,
            } as LocationUpdate
          );

    request.subscribe({
      next: (result: Location) => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedLocation = null;
        this.formInitialData = null;
        
        // Recargar datos para reflejar cambios
        this.loadLocations();
        
        const action = this.formMode === 'create' ? 'creada' : 'actualizada';
        this.notificationService.success(
          `Ubicación ${action} correctamente`,
          {
            duration: 5000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          }
        );
        
        this.logger.info(`Ubicación ${action}`, { data: result });
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        const action = this.formMode === 'create' ? 'crear' : 'actualizar';
        this.handleError(error, `Error al ${action} la ubicación`);
        
        // No cerrar formulario en caso de error
      },
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedLocation = null;
    this.formInitialData = null;
    this.error = null;
    this.logger.debug('Formulario cancelado');
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
    this.viewDialogTitle = '';
  }

  // NUEVO: Método para retry desde el data-table
  onRetry(): void {
    this.logger.info('Reintentando cargar ubicaciones');
    this.loadLocations();
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en LocationListComponent:', error);
    
    let errorMessage = defaultMessage;
    
    if (error.error?.detail) {
      errorMessage = `${defaultMessage}: ${error.error.detail}`;
    } else if (error.message) {
      errorMessage = `${defaultMessage}: ${error.message}`;
    }
    
    this.error = errorMessage;
    
    this.notificationService.error(errorMessage, {
      duration: 7000,
      action: {
        label: 'Cerrar',
        action: () => this.notificationService.dismissAll(),
      },
    });
  }
}