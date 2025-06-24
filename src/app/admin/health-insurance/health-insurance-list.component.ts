import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { HealthInsuranceService } from '../../services/health_insarunce/health-insurance.service';
import {
  HealthInsuranceRead,
  HealthInsuranceCreate,
  HealthInsuranceUpdate,
} from '../../services/interfaces/health-insurance.interfaces';
import { LoggerService } from '../../services/core/logger.service';

@Component({
  selector: 'app-health-insurance-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    EntityFormComponent,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './health-insurance-list.component.html',
  styleUrls: ['./health-insurance-list.component.scss'],
})
export class HealthInsuranceListComponent implements OnInit {
  private service = inject(HealthInsuranceService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  insurances: HealthInsuranceRead[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedInsurance: HealthInsuranceRead | null = null;
  formLoading = false;
  error: string | null = null;

  tableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'discount', label: 'Descuento (%)' },
  ];

  formFields: FormField[] = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    {
      key: 'discount',
      label: 'Descuento (%)',
      type: 'number',
      required: true,
      validators: [Validators.min(0), Validators.max(100)],
    },
  ];

  ngOnInit(): void {
    this.loadInsurances();
  }

  loadInsurances(): void {
    this.loading = true;
    this.error = null;

    this.service.getAll().subscribe({
      next: (data) => {
        this.insurances = data;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al cargar las obras sociales');
        this.loading = false;
      },
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedInsurance = null;
    this.showForm = true;
  }

  onEdit(item: HealthInsuranceRead): void {
    this.formMode = 'edit';
    this.selectedInsurance = { ...item };
    this.showForm = true;
  }

  onDelete(item: HealthInsuranceRead): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Obra Social',
        message: `¿Estás seguro de eliminar "${item.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this.service.delete(item.id).subscribe({
          next: () => {
            this.insurances = this.insurances.filter((i) => i.id !== item.id);
            this.logger.info(`Obra social "${item.name}" eliminada correctamente`);
            this.loading = false;
          },
          error: (err: HttpErrorResponse) => {
            this.handleError(err, `Error al eliminar "${item.name}"`);
            this.loading = false;
          },
        });
      }
    });
  }

  onView(item: HealthInsuranceRead): void {
    alert(`Obra Social: ${item.name}\nDescripción: ${item.description || 'N/A'}\nDescuento: ${item.discount}%`);
  }

  onFormSubmit(formData: HealthInsuranceCreate | HealthInsuranceUpdate): void {
    this.formLoading = true;
    this.error = null;

    if (this.formMode === 'create') {
      this.service.create(formData as HealthInsuranceCreate).subscribe({
        next: (created) => {
          this.insurances.push(created);
          this.logger.info(`Obra social "${created.name}" creada correctamente`);
          this.showForm = false;
          this.formLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err, 'Error al crear la obra social');
          this.formLoading = false;
        },
      });
    } else if (this.selectedInsurance) {
      this.service.update(this.selectedInsurance.id, formData as HealthInsuranceUpdate).subscribe({
        next: (updated) => {
          const index = this.insurances.findIndex((i) => i.id === updated.id);
          if (index !== -1) this.insurances[index] = updated;
          this.logger.info(`Obra social "${updated.name}" actualizada correctamente`);
          this.showForm = false;
          this.formLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err, 'Error al actualizar la obra social');
          this.formLoading = false;
        },
      });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
  }

  private handleError(error: HttpErrorResponse, fallback: string): void {
    this.logger.error('Error en HealthInsuranceListComponent:', error);
    this.error = error.error?.detail || error.message || fallback;
  }
}
