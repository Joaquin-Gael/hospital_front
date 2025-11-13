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
  private notificationService = inject(NotificationService)
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  specialities: Specialty[] = [];
  departments: Department[] = [];
  selectedSpeciality: Specialty | null = null;
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

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'associatedDepartmentName', label: 'Departamento' },
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
      label: 'Departamento ID',
      type: 'select',
      required: true,
      validators: [Validators.required],
    },
  ];

  get formFields(): FormField<SpecialityFormValues>[] {
    if (this._formFields.length === 0 || this.lastFormMode !== this.formMode) {
      this._formFields = this.baseFormFields.map((field) => ({
        ...field,
      }));
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
        this.departments = result.departments,
        this.specialities = result.specialities.map((specialty) => {
          return {
            ...specialty,
            associatedDepartmentName:
              result.departments.find((d) => d.id === specialty.department_id)?.name ||
              'Desconocido',
          };
        });
        const departmentFieldIndex = this.baseFormFields.findIndex(
          (f) => f.key === 'department_id'
        );
        if (departmentFieldIndex !== -1) {
          this.baseFormFields[departmentFieldIndex].options =
            this.departments.map((s) => ({
              value: s.id.toString(),
              label: s.name,
            }));
          this._formFields = [];
        }
        this.loading = false;
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

  onEdit(speciality: Specialty): void {
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

  onView(speciality: Specialty): void {
    this.viewDialogData = speciality;
    this.viewDialogTitle = `Especialidad: ${speciality.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for speciality', speciality);
  }

  onDelete(speciality: Specialty): void {
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
            this.specialities = this.specialities.filter(
              (s) => s.id !== speciality.id
            );
            this.loading = false;
            this.logger.info(
              `Especialidad "${speciality.name}" eliminada correctamente`
            );
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
              '¡Ocurrió un error al eliminar la especialidad!',
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
      name: formData.name,
      description: formData.description ?? '',
      department_id: formData.department_id,
    };

    const updatePayload: SpecialtyUpdate = {
      name: formData.name,
      description: formData.description ?? '',
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
        this.loadData();
        this.logger.info(
          `Especialidad ${
            this.formMode === 'create' ? 'creada' : 'actualizada'
          } correctamente`
        );
        this.notificationService.success(
          `Especialidad ${
            this.formMode === 'create' ? 'creada' : 'actualizada'
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
          } la especialidad`
        );
        this.notificationService.error(
          `¡Ocurrió un error al ${
            this.formMode === 'create' ? 'crear' : 'actualizar'
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
