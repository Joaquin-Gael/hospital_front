import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { SpecialityService } from '../../services/speciality/speciality.service';
import { LoggerService } from '../../services/core/logger.service';
import { Specialty, SpecialtyCreate, SpecialtyUpdate } from '../../services/interfaces/hospital.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

interface ExtendedSpecialty extends Specialty {
  isActive?: boolean;
}

interface SpecialtyFormData {
  name: string;
  description: string;
  department_id: string;
  isActive?: boolean;
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
    MatButtonModule
  ],
  templateUrl: './speciality-list.component.html',
  styleUrls: ['./speciality-list.component.scss'],
})
export class SpecialityListComponent implements OnInit {
  private specialityService = inject(SpecialityService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  specialities: ExtendedSpecialty[] = [];
  selectedSpeciality: ExtendedSpecialty | null = null;
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
      label: 'Nueva Especialidad',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nueva especialidad',
      onClick: () => this.onAddNew()
    }
  ];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'department_id', label: 'Departamento ID' },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'department_id', label: 'Departamento ID' },
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
      required: false,
      validators: [Validators.maxLength(500)]
    },
    {
      key: 'department_id',
      label: 'Departamento ID',
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
    this.loadSpecialities();
  }

  loadSpecialities(): void {
    this.loading = true;
    this.error = null;

    this.specialityService.getSpecialities().subscribe({
      next: (specialities) => {
        this.specialities = specialities.map((s: Specialty) => ({
          ...s,
          isActive: true, // Valor por defecto
        }));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Error al cargar las especialidades');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedSpeciality = null;
    this.showForm = true;
    this.logger.debug('Opening form for new speciality');
  }

  onEdit(speciality: ExtendedSpecialty): void {
    this.formMode = 'edit';
    this.selectedSpeciality = speciality;
    this.showForm = true;
    this.logger.debug('Opening form for editing speciality', speciality);
  }

  onView(speciality: ExtendedSpecialty): void {
    this.viewDialogData = speciality;
    this.viewDialogTitle = `Especialidad: ${speciality.name}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for speciality', speciality);
  }

  onDelete(speciality: ExtendedSpecialty): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Especialidad', message: `¿Está seguro de eliminar la especialidad "${speciality.name}"?` },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;

        this.specialityService.deleteSpeciality(speciality.id).subscribe({
          next: () => {
            this.specialities = this.specialities.filter((s) => s.id !== speciality.id);
            this.loading = false;
            this.logger.info(`Especialidad "${speciality.name}" eliminada correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar la especialidad "${speciality.name}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onFormSubmit(formData: SpecialtyFormData): void {
    this.formLoading = true;
    this.error = null;

    const { isActive, ...specialtyData } = formData;

    const request = this.formMode === 'create'
      ? this.specialityService.addSpeciality(specialtyData as SpecialtyCreate)
      : this.specialityService.updateSpeciality(this.selectedSpeciality!.id, specialtyData as SpecialtyUpdate);

    request.subscribe({
      next: (result: Specialty) => {
        this.formLoading = false;
        this.showForm = false;
        this.loadSpecialities();
        this.logger.info(`Especialidad ${this.formMode === 'create' ? 'creada' : 'actualizada'} correctamente`);
      },
      error: (error: HttpErrorResponse) => {
        this.formLoading = false;
        this.handleError(error, `Error al ${this.formMode === 'create' ? 'crear' : 'actualizar'} la especialidad`);
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedSpeciality = null;
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