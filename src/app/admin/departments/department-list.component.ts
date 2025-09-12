import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../../shared/entity-form/entity-form.component';
import { DepartmentService } from '../../services/department/department.service';
import { LoggerService } from '../../services/core/logger.service';
import { Department } from '../../services/interfaces/hospital.interfaces';
import { Validators } from '@angular/forms';

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
    EntityFormComponent
  ],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss']
})
export class DepartmentListComponent implements OnInit {
  private departmentService = inject(DepartmentService);
  private logger = inject(LoggerService);

  departments: Department[] = [];
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
      onClick: () => this.onAddNew()
    }
  ];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'created_at', label: 'Fecha de Creación' },
  ];

  formFields: FormField[] = [
    {
      key: 'name',
      label: 'Nombre del Departamento',
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
    }
  ];

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading = true;
    this.error = null;
    
    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loading = false;
        this.logger.info(`Loaded ${departments.length} departments`);
      },
      error: (error) => {
        this.error = 'Error al cargar los departamentos. Intenta nuevamente.';
        this.loading = false;
        this.logger.error('Failed to load departments', error);
      }
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
    if (confirm(`¿Estás seguro de que quieres eliminar el departamento "${department.name}"?`)) {
      this.departmentService.deleteDepartment(department.id).subscribe({
        next: () => {
          this.loadDepartments();
          this.logger.info(`Department ${department.name} deleted successfully`);
        },
        error: (error) => {
          this.error = 'Error al eliminar el departamento. Intenta nuevamente.';
          this.logger.error('Failed to delete department', error);
        }
      });
    }
  }

  onFormSubmit(formData: Partial<Department>): void {
    this.formLoading = true;
    this.error = null;

    const request = this.formMode === 'create'
      ? this.departmentService.addDepartment(formData as Department)
      : this.departmentService.updateDepartment(this.selectedDepartment!.id, formData);

    request.subscribe({
      next: () => {
        this.formLoading = false;
        this.showForm = false;
        this.selectedDepartment = null;
        this.loadDepartments();
        this.logger.info(`Department ${this.formMode === 'create' ? 'created' : 'updated'} successfully`);
      },
      error: (error) => {
        this.formLoading = false;
        this.error = `Error al ${this.formMode === 'create' ? 'crear' : 'actualizar'} el departamento. Intenta nuevamente.`;
        this.logger.error(`Failed to ${this.formMode} department`, error);
      }
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
}