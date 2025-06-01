import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { SpecialityService } from '../../services/speciality/speciality.service';
import { Specialty, SpecialtyCreate, SpecialtyUpdate } from '../../services/interfaces/hospital.interfaces';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

// Interfaz extendida para incluir isActive
interface ExtendedSpecialty extends Specialty {
  isActive?: boolean;
}

// Interfaz para el formulario
interface SpecialtyFormData {
  id: string;
  name: string;
  description: string;
  department_id: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-speciality-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, EntityFormComponent, MatDialogModule, MatButtonModule],
  templateUrl: './speciality-list.component.html',
  styleUrls: ['./speciality-list.component.scss'],
})
export class SpecialityListComponent implements OnInit {
  private specialityService = inject(SpecialityService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  specialities: ExtendedSpecialty[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedSpeciality: ExtendedSpecialty | null = null;
  formLoading: boolean = false;
  error: string | null = null;

  tableColumns = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Nombre' },
	{ key: 'description', label: 'Descripción' },
	{ key: 'department_id', label: 'ID de Departamento' },
	//{ key: 'isActive', label: 'Activo', format: (value?: boolean) => value ? 'Sí' : 'No' },
  ];

  formFields: FormField[] = [
	{ key: 'name', label: 'Nombre', type: 'text', required: true },
	{ key: 'description', label: 'Descripción', type: 'textarea', required: true },
	{ key: 'department_id', label: 'ID de Departamento', type: 'text', required: true },
	{ key: 'isActive', label: 'Activo', type: 'checkbox', defaultValue: true },
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
  }

  onEdit(speciality: ExtendedSpecialty): void {
	this.formMode = 'edit';
	this.selectedSpeciality = speciality;
	this.showForm = true;
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

  onView(speciality: ExtendedSpecialty): void {
	alert(`Detalles de la especialidad: ${speciality.name}\nDescripción: ${speciality.description}\nDepartamento ID: ${speciality.department_id}\nActivo: ${speciality.isActive ? 'Sí' : 'No'}`);
  }

  onFormSubmit(formData: SpecialtyFormData): void {
	this.formLoading = true;
	this.error = null;

	const { isActive, ...specialtyData } = formData;

	if (this.formMode === 'create') {
	  this.specialityService.addSpeciality(specialtyData as SpecialtyCreate).subscribe({
		next: (newSpeciality: Specialty) => {
		  this.specialities.push({
			...newSpeciality,
			isActive: isActive !== undefined ? isActive : true,
		  });
		  this.formLoading = false;
		  this.showForm = false;
		  this.logger.info(`Especialidad "${newSpeciality.name}" creada correctamente`);
		},
		error: (error: HttpErrorResponse) => {
		  this.handleError(error, 'Error al crear la especialidad');
		  this.formLoading = false;
		},
	  });
	} else {
	  if (!this.selectedSpeciality) return;

	  this.specialityService.updateSpeciality(this.selectedSpeciality.id, specialtyData as SpecialtyUpdate).subscribe({
		next: (updatedSpeciality: Specialty) => {
		  const index = this.specialities.findIndex((s) => s.id === updatedSpeciality.id);
		  if (index !== -1) {
			this.specialities[index] = {
			  ...updatedSpeciality,
			  isActive: isActive !== undefined ? isActive : this.specialities[index].isActive,
			};
		  }
		  this.formLoading = false;
		  this.showForm = false;
		  this.logger.info(`Especialidad "${updatedSpeciality.name}" actualizada correctamente`);
		},
		error: (error: HttpErrorResponse) => {
		  this.handleError(error, 'Error al actualizar la especialidad');
		  this.formLoading = false;
		},
	  });
	}
  }

  onFormCancel(): void {
	this.showForm = false;
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
	this.logger.error('Error en SpecialityListComponent:', error);
	this.error = error.error?.detail || error.message || defaultMessage;
  }
}