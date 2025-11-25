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
import { SpecialityService } from '../../services/speciality/speciality.service';
import { DepartmentService } from '../../services/department/department.service';
import { LoggerService } from '../../services/core/logger.service';
import {
  Specialty,
  SpecialtyCreate,
  SpecialtyUpdate,
} from '../../services/interfaces/hospital.interfaces';
import { Department } from '../../services/interfaces/hospital.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { NotificationService } from '../../core/notification';
import { forkJoin } from 'rxjs';

type SpecialityFormValues = EntityFormPayload & SpecialtyCreate;

// IMPORTANTE: Extender Specialty para incluir el campo adicional
interface SpecialtyWithDepartment extends Specialty {
  associatedDepartmentName?: string;
}

@Component({
  selector: 'app-speciality-list',
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
  templateUrl: './speciality-list.component.html',
  styleUrls: ['./speciality-list.component.scss'],
})
export class SpecialityListComponent implements OnInit {
  private specialityService = inject(SpecialityService);
  private departmentService = inject(DepartmentService);
  private notificationService = inject(NotificationService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  // CAMBIO 1: Usar el tipo extendido
  specialities: SpecialtyWithDepartment[] = [];
  departments: Department[] = [];
  selectedSpeciality: SpecialtyWithDepartment | null = null;
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
      label: 'Nueva Especialidad',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nueva especialidad',
      onClick: () => this.onAddNew(),
    },
  ];

  // CAMBIO 2: Configurar columnas con sortable
  tableColumns: TableColumn[] = [
    { 
      key: 'name', 
      label: 'Nombre',
      sortable: true  // Explícitamente sortable
    },
    { 
      key: 'description', 
      label: 'Descripción',
      sortable: true
    },
    { 
      key: 'associatedDepartmentName', 
      label: 'Departamento',
      sortable: true
    },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'associatedDepartmentName', label: 'Departamento' },
  ];

  baseFormFields: FormField<SpecialityFormValues>[] = [
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
    {
      key: 'department_id',
      label: 'Departamento',  // CAMBIO 3: Mejor label
      type: 'select',
      required: true,
      validators: [Validators.required],
      options: [],  // Se llena dinámicamente
    },
  ];

  get formFields(): FormField<SpecialityFormValues>[] {
    // CAMBIO 4: Simplificar la lógica de regeneración
    if (this.lastFormMode !== this.formMode) {
      this._formFields = [...this.baseFormFields];
      this.lastFormMode = this.formMode;
    }
    return this._formFields;
  }

  private _formFields: FormField<SpecialityFormValues>[] = [];
  formInitialData: Partial<SpecialityFormValues> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      specialities: this.specialityService.getSpecialities(),
      departments: this.departmentService.getDepartments(),
    }).subscribe({
      next: (result) => {
        // CAMBIO 5: Guardar departamentos primero
        this.departments = result.departments;

        // CAMBIO 6: Mapear especialidades con nombre de departamento
        this.specialities = result.specialities.map((specialty) => ({
          ...specialty,
          associatedDepartmentName:
            this.departments.find((d) => d.id === specialty.department_id)?.name ||
            'Desconocido',
        }));

        // CAMBIO 7: Actualizar opciones del form field
        const departmentFieldIndex = this.baseFormFields.findIndex(
          (f) => f.key === 'department_id'
        );
        
        if (departmentFieldIndex !== -1) {
          this.baseFormFields[departmentFieldIndex].options = this.departments.map((dept) => ({
            value: dept.id,  // ID como string directo
            label: dept.name,
          }));
          
          // Forzar regeneración de form fields
          this._formFields = [];
          this.lastFormMode = null;
        }

        this.loading = false;
        this.logger.info(`Cargadas ${this.specialities.length} especialidades`);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(
          error,
          'Error al cargar las especialidades y departamentos'
        );
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedSpeciality = null;
    this.formInitialData = null;
    this.showForm = true;
    this.logger.debug('Opening form for new speciality');
  }

  onEdit(speciality: SpecialtyWithDepartment): void {
    this.formMode = 'edit';
    this.selectedSpeciality = speciality;
    
    this.formInitialData = {
      name: speciality.name ?? '',
      description: speciality.description ?? '',
      department_id: speciality.department_id ?? '',
    };
    
    this.showForm = true;
    this.logger.debug('Opening form for editing speciality', speciality);
  }

  onView(speciality: SpecialtyWithDepartment): void {
    this.viewDialogData = speciality;
    this.viewDialogTitle = `Especialidad: ${speciality.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for speciality', speciality);
  }

  onDelete(speciality: SpecialtyWithDepartment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Especialidad',
        message: `¿Está seguro de eliminar la especialidad "${speciality.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;

        this.specialityService.deleteSpeciality(speciality.id).subscribe({
          next: () => {
            // CAMBIO 9: Filtrar sin recargar todo
            this.specialities = this.specialities.filter(
              (s) => s.id !== speciality.id
            );
            
            this.loading = false;
            this.logger.info(`Especialidad "${speciality.name}" eliminada correctamente`);
            
            this.notificationService.success(
              '¡Especialidad eliminada con éxito!',
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
            this.handleError(
              error,
              `Error al eliminar la especialidad "${speciality.name}"`
            );
            
            this.notificationService.error(
              'Ocurrió un error al eliminar la especialidad',
              {
                duration: 7000,
                action: {
                  label: 'Cerrar',
                  action: () => this.notificationService.dismissAll(),
                },
              }
            );
            
            this.loading = false;
          },
        });
      }
    });
  }

  onFormSubmit(formData: SpecialityFormValues): void {
    this.formLoading = true;
    this.error = null;

    const createPayload: SpecialtyCreate = {
      name: formData.name.trim(),
      description: formData.description?.trim() ?? '',
      department_id: formData.department_id,
    };

    const updatePayload: SpecialtyUpdate = {
      name: formData.name.trim(),
      description: formData.description?.trim() ?? '',
      department_id: formData.department_id,
    };

    const request =
      this.formMode === 'create'
        ? this.specialityService.addSpeciality(createPayload)
        : this.specialityService.updateSpeciality(
            this.selectedSpeciality!.id,
            updatePayload
          );

    request.subscribe({
      next: () => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedSpeciality = null;
        this.formInitialData = null;
        
        // Recargar datos para reflejar cambios
        this.loadData();
        
        const action = this.formMode === 'create' ? 'creada' : 'actualizada';
        this.logger.info(`Especialidad ${action} correctamente`);
        
        this.notificationService.success(
          `¡Especialidad ${action} con éxito!`,
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
        const action = this.formMode === 'create' ? 'crear' : 'actualizar';
        
        this.handleError(error, `Error al ${action} la especialidad`);
        
        this.notificationService.error(
          `Ocurrió un error al ${action} la especialidad`,
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
    this.selectedSpeciality = null;
    this.formInitialData = null;
    this.logger.debug('Form cancelled');
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en SpecialityListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}