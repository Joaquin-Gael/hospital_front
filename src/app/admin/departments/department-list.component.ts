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
import { DepartmentService } from '../../services/department/department.service';
import { LocationService } from '../../services/location/location.service';
import { LoggerService } from '../../services/core/logger.service';
import { Department } from '../../services/interfaces/hospital.interfaces';
import { Location as LocationModel } from '../../services/interfaces/hospital.interfaces';
import {
  DepartmentCreate,
  DepartmentUpdate,
} from '../../services/interfaces/hospital.interfaces';
import { Validators } from '@angular/forms';
import { NotificationService } from '../../core/notification';
import { forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

type DepartmentFormValues = DepartmentCreate & EntityFormPayload;

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    ViewDialogComponent,
    DataTableComponent,
    EntityFormComponent,
    MatDialogModule
  ],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
})
export class DepartmentListComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private logger = inject(LoggerService);
  private notificationService = inject(NotificationService);
  private locationService = inject(LocationService);
  private dialog = inject(MatDialog);

  departments: Department[] = [];
  locations: LocationModel[] = [];
  selectedDepartment: Department | null = null;
  loading = false;
  formLoading = false;
  error: string | null = null;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  lastFormMode: 'create' | 'edit' | null = null;

  // View dialog
  viewDialogOpen = false;
  viewDialogData: any = {};
  viewDialogTitle = '';

  headerActions: ActionButton[] = [
    {
      label: 'Nuevo Departamento',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nuevo departamento',
      onClick: () => this.onAddNew(),
    },
    {
      label: 'Refrescar',
      icon: 'refresh',
      variant: 'secondary',
      ariaLabel: 'Refrescar departamentos',
      onClick: () => this.loadData(),
    },
  ];

  // CORREGIDO: Agregado sortable y mejor formato
  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción', sortable: true },
    { key: 'associatedLocationName', label: 'Ubicación', sortable: true }, 
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'associatedLocationName', label: 'Ubicación' },
  ];

  baseFormFields: FormField<DepartmentFormValues>[] = [
    {
      key: 'name',
      label: 'Nombre del Departamento',
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
    {
      key: 'location_id',
      label: 'Ubicación',
      type: 'select',
      required: true,
      validators: [Validators.required],
    },
  ];

  get formFields(): FormField<DepartmentFormValues>[] {
    if (this._formFields.length === 0 || this.lastFormMode !== this.formMode) {
      this._formFields = this.baseFormFields.map((field) => ({
        ...field,
      }));
      this.lastFormMode = this.formMode;
    }
    return this._formFields;
  }

  private _formFields: FormField<DepartmentFormValues>[] = [];
  formInitialData: Partial<DepartmentFormValues> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      departments: this.departmentService.getDepartments(),
      locations: this.locationService.getLocations(),
    }).subscribe({
      next: (result) => {
        this.locations = result.locations;
        
        // CORREGIDO: Mapear con nombre de ubicación
        this.departments = result.departments.map((department) => ({
          ...department,
          associatedLocationName: result.locations.find(
            (loc) => loc.id === department.location_id
          )?.name || 'Sin ubicación',
        }));

        // Actualizar opciones del select de ubicaciones
        const locationFieldIndex = this.baseFormFields.findIndex(
          (f) => f.key === 'location_id'
        );
        
        if (locationFieldIndex !== -1) {
          this.baseFormFields[locationFieldIndex].options = this.locations.map(
            (loc) => ({
              value: loc.id.toString(),
              label: loc.name,
            })
          );
          this._formFields = [];
        }
        
        this.loading = false;
        this.logger.info('Departamentos cargados correctamente', {
          count: this.departments.length,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar los departamentos');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedDepartment = null;
    this.formInitialData = null;
    this.showForm = true;
    this.error = null;
    this.logger.debug('Abriendo formulario para nuevo departamento');
  }

  onEdit(department: Department): void {
    this.formMode = 'edit';
    this.selectedDepartment = department;
    this.formInitialData = {
      name: department.name,
      description: department.description,
      location_id: department.location_id,
    };
    this.showForm = true;
    this.error = null;
    this.logger.debug('Editando departamento', { id: department.id });
  }

  onView(department: Department): void {
    this.viewDialogData = department;
    this.viewDialogTitle = `Departamento: ${department.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Visualizando departamento', { id: department.id });
  }

  onDelete(department: Department): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Departamento',
        message: `¿Está seguro de eliminar el departamento "${department.name}"? Esta acción no se puede deshacer.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loading = true;

        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            // Actualizar lista local
            this.departments = this.departments.filter(
              (d) => d.id !== department.id
            );
            
            this.loading = false;
            this.notificationService.success(
              `Departamento "${department.name}" eliminado correctamente`,
              {
                duration: 5000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            
            this.logger.info('Departamento eliminado', {
              id: department.id,
              name: department.name,
            });
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(
              error,
              `Error al eliminar el departamento "${department.name}"`
            );
            this.loading = false;
          },
        });
      }
    });
  }

  onFormSubmit(formData: DepartmentFormValues): void {
    this.formLoading = true;
    this.error = null;

    const payload: DepartmentCreate = {
      name: formData.name.trim(),
      description: formData.description?.toString().trim() || '',
      location_id: formData.location_id,
    };

    const request =
      this.formMode === 'create'
        ? this.departmentService.addDepartment(payload)
        : this.departmentService.updateDepartment(
            this.selectedDepartment!.id,
            payload as DepartmentUpdate
          );

    request.subscribe({
      next: (response) => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedDepartment = null;
        this.formInitialData = null;
        
        // Recargar datos para reflejar cambios
        this.loadData();
        
        const action = this.formMode === 'create' ? 'creado' : 'actualizado';
        this.notificationService.success(
          `Departamento ${action} correctamente`,
          {
            duration: 5000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          }
        );
        
        this.logger.info(`Departamento ${action}`, { data: response });
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        const action = this.formMode === 'create' ? 'crear' : 'actualizar';
        this.handleError(error, `Error al ${action} el departamento`);
        
        // CORREGIDO: No cerrar el formulario en caso de error
        // para que el usuario pueda corregir
      },
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedDepartment = null;
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
    this.logger.info('Reintentando cargar departamentos');
    this.loadData();
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en DepartmentListComponent:', error);
    
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