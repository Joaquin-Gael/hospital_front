import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { LocationService } from '../../services/location/location.service';
import { Location, LocationCreate, LocationUpdate } from '../../services/interfaces/hospital.interfaces';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

// Interfaz extendida para la tabla y estado local
interface ExtendedLocation extends Location {
  departmentCount?: number;
}

interface LocationFormData {
  name: string;
  description: string;
}

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, EntityFormComponent, MatDialogModule, MatButtonModule],
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
})
export class LocationListComponent implements OnInit {
  private locationService = inject(LocationService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  locations: ExtendedLocation[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedLocation: ExtendedLocation | null = null;
  formLoading: boolean = false;
  error: string | null = null;

  tableColumns = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'id', label: 'ID de Ubicación' }, 
    { key: 'departmentCount', label: 'Número de Departamentos', format: (value: number) => (value || 0).toString() },
  ];

  baseFormFields: FormField[] = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'description', label: 'Descripción', type: 'textarea', required: false },
    { key: 'id', label: 'ID de Ubicación', type: 'text', required: true, readonly: true },
  ];

  private _formFields: FormField[] = [];
  get formFields(): FormField[] {
    if (this.formMode === 'create') {
      if (!this._formFields.length || this._formFields.some(f => f.key === 'location_id')) {
        this._formFields = this.baseFormFields.filter(field => field.key !== 'location_id');
      }
    } else {
      if (!this._formFields.length || this._formFields.length !== this.baseFormFields.length) {
        this._formFields = [...this.baseFormFields];
      }
    }
    return this._formFields;
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.error = null;

    this.locationService.getLocations().subscribe({
      next: (locations) => {
        console.log('Datos recibidos en loadLocations:', locations);
        this.locations = locations.map(l => ({
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
    this.showForm = true;
  }

  onEdit(location: ExtendedLocation): void {
    this.formMode = 'edit';
    this.selectedLocation = { 
      ...location,
      id: location.id
    };
    console.log('selectedLocation en onEdit:', this.selectedLocation);
    this.showForm = true;
  }

  onDelete(location: ExtendedLocation): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Ubicación', message: `¿Está seguro de eliminar la ubicación "${location.name}"?` },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;

        this.locationService.deleteLocation(location.id).subscribe({
          next: () => {
            this.locations = this.locations.filter(l => l.id !== location.id);
            this.loading = false;
            this.logger.info(`Ubicación "${location.name}" eliminada correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar la ubicación "${location.name}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onView(location: ExtendedLocation): void {
    alert(`Detalles de la ubicación: ${location.name}\nDescripción: ${location.description || 'N/A'}\nID: ${location.id}\nDepartamentos: ${location.departments?.length || 0}`);
  }

  onFormSubmit(formData: LocationFormData): void {
    this.formLoading = true;
    this.error = null;

    if (this.formMode === 'create') {
      const locationData: LocationCreate = {
        name: formData.name,
        description: formData.description || '',
      };

      this.locationService.addLocation(locationData).subscribe({
        next: (newLocation) => {
          this.locations.push({
            ...newLocation,
            departmentCount: 0,
          });
          this.formLoading = false;
          this.showForm = false;
          this.logger.info(`Ubicación "${newLocation.name}" creada correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'Error al crear la ubicación');
          this.formLoading = false;
        },
      });
    } else {
      if (!this.selectedLocation) return;

      const locationData: LocationUpdate = {
        name: formData.name,
        description: formData.description || '',
        location_id: this.selectedLocation.id, 
      };

      this.locationService.updateLocation(this.selectedLocation.id, locationData).subscribe({
        next: (updatedLocation) => {
          const index = this.locations.findIndex(l => l.id === updatedLocation.id);
          if (index !== -1) {
            this.locations[index] = {
              ...updatedLocation,
              departmentCount: this.locations[index].departmentCount,
            };
          }
          this.formLoading = false;
          this.showForm = false;
          this.logger.info(`Ubicación "${updatedLocation.name}" actualizada correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'Error al actualizar la ubicación');
          this.formLoading = false;
        },
      });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en LocationListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}