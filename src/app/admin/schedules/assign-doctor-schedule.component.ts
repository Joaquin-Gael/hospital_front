import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { DoctorService } from '../../services/doctor/doctor.service';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { MatButtonModule } from '@angular/material/button';
import { Validators } from '@angular/forms';
import { Doctor, MedicalSchedule } from '../../services/interfaces/doctor.interfaces';

interface AssignData {
  context: 'doctor' | 'schedule';
  doctorId?: string;
  scheduleId?: string;
  doctors: Doctor[];
  schedules: MedicalSchedule[];
}

@Component({
  selector: 'app-assign-doctor-schedule',
  standalone: true,
  imports: [CommonModule, EntityFormComponent, MatDialogModule, MatButtonModule],
  template: `
    <div class="assign-dialog">
      <h2 mat-dialog-title>{{ title }}</h2>
      <mat-dialog-content>
        <div *ngIf="error" class="error-message" role="alert">
          {{ error }}
          <button class="close-button" (click)="error = null" aria-label="Cerrar mensaje de error">
            <span class="material-icons">close</span>
          </button>
        </div>
        <app-entity-form
          [fields]="formFields"
          [title]="title"
          [submitLabel]="'Asociar'"
          [loading]="loading"
          (formSubmit)="onSubmit($event)"
          (formCancel)="onCancel()"
        ></app-entity-form>
      </mat-dialog-content>
    </div>
  `,
  styles: `
    @use 'sass:color';

    .assign-dialog {
      min-width: 400px;
      padding: 24px;
      background-color: #fff;
      border-radius: 8px;
    }
    h2 {
      margin: 0 0 24px 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 16px;
    }
    .error-message {
      background-color: #f44336;
      background-color: color.adjust(#f44336, $lightness: 35%);
      border-left: 4px solid #f44336;
      color: color.adjust(#f44336, $lightness: 20%);
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .close-button {
      background: none;
      border: none;
      color: color.adjust(#f44336, $lightness: 20%);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .close-button:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  `
})
export class AssignDoctorScheduleComponent {
  loading = false;
  error: string | null = null;
  title: string;
  formFields: FormField[] = [];

  constructor(
    private dialogRef: MatDialogRef<AssignDoctorScheduleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignData,
    private doctorService: DoctorService,
    private scheduleService: ScheduleService
  ) {
    this.title = this.data.context === 'doctor'
      ? 'Asociar Horario a Doctor'
      : 'Asociar Doctor a Horario';

    this.formFields = [
      {
        key: 'doctorId',
        label: 'Doctor',
        type: 'select',
        required: true,
        validators: [Validators.required],
        options: this.data.doctors
          .filter(d => d.is_active) 
          .map(d => ({
            value: d.id,
            label: `${d.first_name} ${d.last_name} (${d.dni})`
          })),
        defaultValue: this.data.doctorId || ''
      },
      {
        key: 'scheduleId',
        label: 'Horario',
        type: 'select',
        required: true,
        validators: [Validators.required],
        options: this.data.schedules.map(s => ({
          value: s.id,
          label: `${this.getDayLabel(s.day)} ${s.start_time}-${s.end_time}`
        })),
        defaultValue: this.data.scheduleId || ''
      }
    ];
  }

  private getDayLabel(englishDay: string): string {
    const daysMap: { [key: string]: string } = {
      'Sunday': 'Domingo',
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado'
    };
    return daysMap[englishDay] || englishDay;
  }

  onSubmit(formData: { doctorId: string; scheduleId: string }): void {
    if (this.data.doctorId && formData.doctorId !== this.data.doctorId) {
      this.error = 'El ID del doctor no coincide con el contexto seleccionado.';
      this.loading = false;
      return;
    }
    if (this.data.scheduleId && formData.scheduleId !== this.data.scheduleId) {
      this.error = 'El ID del horario no coincide con el contexto seleccionado.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    const request = this.data.context === 'doctor'
      ? this.doctorService.addSchedule(formData.doctorId, formData.scheduleId)
      : this.scheduleService.addDoctorToSchedule(formData.doctorId, formData.scheduleId);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ success: true });
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.detail || 'Error al asociar doctor y horario';
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}