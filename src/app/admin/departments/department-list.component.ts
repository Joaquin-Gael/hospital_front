import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { DepartmentService } from '../../services/department/department.service';
import { Department, DepartmentCreate, DepartmentUpdate } from '../../services/interfaces/hospital.interfaces';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

// Interfaz extendida para la tabla y estado local
interface ExtendedDepartment extends Department {
  specialtyCount?: number; // Ejemplo de campo calculado
}

interface DepartmentFormData {
  name: string;
  description: string;
  location_id: string;
}

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, EntityFormComponent, MatDialogModule, MatButtonModule],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
})
export class DepartmentListComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  departments: ExtendedDepartment[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedDepartment: ExtendedDepartment | null = null;
  formLoading: boolean = false;
  error: string | null = null;

  tableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'location_id', label: 'ID de Ubicación' },
    { key: 'specialtyCount', label: 'Número de Especialidades', format: (value: number) => (value || 0).toString() },
  ];

  formFields: FormField[] = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'description', label: 'Descripción', type: 'textarea', required: false },
    { key: 'location_id', label: 'ID de Ubicación', type: 'text', required: true },
  ];

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading = true;
    this.error = null;

    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        console.log('Datos recibidos en loadDepartments:', departments);
        this.departments = departments.map(d => ({
          ...d,
          specialtyCount: d.specialities?.length || 0,
        }));
        this.loading = false;
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
    this.showForm = true;
  }

  onEdit(department: ExtendedDepartment): void {
    this.formMode = 'edit';
    this.selectedDepartment = { ...department };
    this.showForm = true;
  }

  onDelete(department: ExtendedDepartment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Departamento', message: `¿Está seguro de eliminar el departamento "${department.name}"?` },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;

        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            this.departments = this.departments.filter(d => d.id !== department.id);
            this.loading = false;
            this.logger.info(`Departamento "${department.name}" eliminado correctamente`);
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error, `Error al eliminar el departamento "${department.name}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onView(department: ExtendedDepartment): void {
    alert(`Detalles del departamento: ${department.name}\nDescripción: ${department.description || 'N/A'}\nID de Ubicación: ${department.location_id}\nEspecialidades: ${department.specialities?.length || 0}`);
  }

  onFormSubmit(formData: DepartmentFormData): void {
    this.formLoading = true;
    this.error = null;

    const departmentData: DepartmentCreate | DepartmentUpdate = {
      name: formData.name,
      description: formData.description || '',
      location_id: formData.location_id,
    };

    if (this.formMode === 'create') {
      this.departmentService.addDepartment(departmentData as DepartmentCreate).subscribe({
        next: (newDepartment) => {
          this.departments.push({
            ...newDepartment,
            specialtyCount: 0,
          });
          this.formLoading = false;
          this.showForm = false;
          this.logger.info(`Departamento "${newDepartment.name}" creado correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'Error al crear el departamento');
          this.formLoading = false;
        },
      });
    } else {
      if (!this.selectedDepartment) return;

      this.departmentService.updateDepartment(this.selectedDepartment.id, departmentData as DepartmentUpdate).subscribe({
        next: (updatedDepartment) => {
          const index = this.departments.findIndex(d => d.id === updatedDepartment.id);
          if (index !== -1) {
            this.departments[index] = {
              ...updatedDepartment,
              specialtyCount: this.departments[index].specialtyCount,
            };
          }
          this.formLoading = false;
          this.showForm = false;
          this.logger.info(`Departamento "${updatedDepartment.name}" actualizado correctamente`);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'Error al actualizar el departamento');
          this.formLoading = false;
        },
      });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en DepartmentListComponent:', error);
    this.error = error.error?.detail || error.message || defaultMessage;
  }
}