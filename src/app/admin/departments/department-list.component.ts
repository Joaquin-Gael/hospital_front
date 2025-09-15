import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  FormField,
} from '../../shared/entity-form/entity-form.component';
import { DepartmentService } from '../../services/department/department.service';
import { LocationService } from '../../services/location/location.service';
import { LoggerService } from '../../services/core/logger.service';
import { Department } from '../../services/interfaces/hospital.interfaces';
import { Location as LocationModel } from '../../services/interfaces/hospital.interfaces';
import { Validators } from '@angular/forms';
import { NotificationService } from '../../core/notification';
import { forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

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
  private dialog = inject(MatDialog)

  departments: Department[] = [];
  locations: LocationModel[] = [];
  selectedDepartment: Department | null = null;
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
      label: 'Nuevo Departamento',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nuevo departamento',
      onClick: () => this.onAddNew(),
    },
  ];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'associatedLocationName', label: 'Ubicación' }, 
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'associatedLocationName', label: 'Ubicación' },
    //key: 'created_at', label: 'Fecha de Creación' },
  ];

  baseFormFields: FormField[] = [
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
      label: 'ID de Ubicación',
      type: 'select',
      required: true,
      validators: [Validators.required],
    },
  ];

  get formFields(): FormField[] {
    if (this._formFields.length === 0 || this.formMode !== this.formMode) {
      this._formFields = this.baseFormFields.map((field) => ({
        ...field,
      }));
    }
    return this._formFields;
  }

  private _formFields: FormField[] = [];

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
        this.departments = result.departments.map((department) => {
          return {
            ...department,
            associatedLocationName: result.locations.find((s) => s.id === department.location_id)?.name || 'Desconocida',
          };
        });
        const locationFieldIndex = this.baseFormFields.findIndex(
          (f) => f.key === 'location_id'
        );
        if (locationFieldIndex !== -1) {
          this.baseFormFields[locationFieldIndex].options = this.locations.map(
            (s) => ({
              value: s.id.toString(),
              label: s.name,
            })
          );
          this._formFields = [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los datos. Intenta nuevamente.';
        this.loading = false;
        this.logger.error('Failed to load departments or locations', error);
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedDepartment = null;
    this.showForm = true;
    this.logger.debug('Opening form for new department');
  }

  onEdit(department: Department): void {
    this.formMode = 'edit';
    this.selectedDepartment = department;
    this.showForm = true;
    this.logger.debug('Opening form for editing department', department);
  }

  onView(department: Department): void {
    this.viewDialogData = department;
    this.viewDialogTitle = `Departamento: ${department.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for department', department);
  }

  onDelete(department: Department): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Departamento',
        message: `¿Está seguro de eliminar el departamento "${department.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;

        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            this.departments = this.departments.filter((d) => d.id !== department.id);
            this.loading = false;
            this.notificationService.success(
              '¡Departamento eliminado con éxito!',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            this.logger.info(
              `Departamento "${department.name}" eliminado correctamente`
            );
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

  onFormSubmit(formData: Partial<Department>): void {
    this.formLoading = true;
    this.error = null;

    const request =
      this.formMode === 'create'
        ? this.departmentService.addDepartment(formData as Department)
        : this.departmentService.updateDepartment(
            this.selectedDepartment!.id,
            formData
          );

    request.subscribe({
      next: () => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedDepartment = null;
        this.loadData();
        this.logger.info(
          `Department ${
            this.formMode === 'create' ? 'created' : 'updated'
          } successfully`
        );
        this.notificationService.success(
          `¡Departamento ${
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
      error: (error) => {
        this.formLoading = false;
        this.error = `Error al ${
          this.formMode === 'create' ? 'crear' : 'actualizar'
        } el departamento. Intenta nuevamente.`;
        this.logger.error(`Failed to ${this.formMode} department`, error);
        this.notificationService.success(
          `¡Ocurrió un error al ${
            this.formMode === 'create' ? 'crear' : 'actualizar'
          } el departamento!`,
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
    this.selectedDepartment = null;
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