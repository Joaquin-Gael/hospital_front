import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import {
  EntityFormComponent,
  EntityFormPayload,
  FormField,
} from '../../shared/entity-form/entity-form.component';
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

type AssignFormValues = EntityFormPayload & {
  doctorId: string;
  scheduleId: string;
};

@Component({
  selector: 'app-assign-doctor-schedule',
  standalone: true,
  imports: [CommonModule, EntityFormComponent, MatDialogModule, MatButtonModule],
  template: `
    <div class="assign-dialog">
      <mat-dialog-content>
        @if (error) {
          <div class="error-message" role="alert">
            {{ error }}
            <button 
              class="close-button" 
              (click)="error = null" 
              aria-label="Cerrar mensaje de error">
              <span class="material-icons">close</span>
            </button>
          </div>
        }
        
        <app-entity-form
          [fields]="formFields"
          [title]="title"
          [submitLabel]="'Asociar'"
          [loading]="loading"
          (formSubmit)="onSubmit($event)"
          (formCancel)="onCancel()">
        </app-entity-form>
      </mat-dialog-content>
    </div>
  `,
  styles: `
    .assign-dialog {
      min-width: 400px;
      padding: 24px;
      background-color: #fff;
      border-radius: 8px;
    }

    .error-message {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      color: #c62828;
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .close-button {
      background: none;
      border: none;
      color: #c62828;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      .material-icons {
        font-size: 18px;
      }
    }
  `
})
export class AssignDoctorScheduleComponent {
  loading = false;
  error: string | null = null;
  title: string;
  formFields: FormField<AssignFormValues>[] = [];

  private readonly daysMap: Record<string, string> = {
    'Sunday': 'Domingo',
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado'
  };

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
            label: `${d.first_name} ${d.last_name} (DNI: ${d.dni})`
          })),
        defaultValue: this.data.doctorId || '',
        readonly: !!this.data.doctorId
      },
      {
        key: 'scheduleId',
        label: 'Horario',
        type: 'select',
        required: true,
        validators: [Validators.required],
        options: this.data.schedules.map(s => ({
          value: s.id,
          label: `${this.daysMap[s.day] || s.day} ${s.start_time}-${s.end_time}`
        })),
        defaultValue: this.data.scheduleId || '',
        readonly: !!this.data.scheduleId
      }
    ];
  }

  onSubmit(formData: AssignFormValues): void {
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