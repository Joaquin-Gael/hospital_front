import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import {
  EntityFormComponent,
  FormField,
} from '../shared/entity-form/entity-form.component';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { DoctorService } from '../../services/doctor/doctor.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { Validators } from '@angular/forms';
import {
  MedicalScheduleCreate,
  MedicalScheduleUpdate,
} from '../../services/interfaces/hospital.interfaces';
import {
  Doctor,
  MedicalSchedule,
} from '../../services/interfaces/doctor.interfaces';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

interface ExtendedSchedule extends MedicalSchedule {
  doctorName: string;
}

interface ScheduleFormData {
  doctorId?: string;
  day: string; // '0'..'6'
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    EntityFormComponent,
    MatDialogModule,
  ],
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.scss'],
})
export class ScheduleListComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private doctorService = inject(DoctorService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);

  schedules: ExtendedSchedule[] = [];
  doctors: Doctor[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedSchedule: ExtendedSchedule | null = null;
  formLoading = false;
  error: string | null = null;

  daysOfWeek = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
  ];

  private englishDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  tableColumns = [
    {
      key: 'day',
      label: 'Día',
    },
    { key: 'start_time', label: 'Hora Inicio' },
    { key: 'end_time', label: 'Hora Fin' },
  ];

  private baseFormFields: FormField[] = [
    {
      key: 'day',
      label: 'Día de la semana',
      type: 'select',
      required: true,
      validators: [Validators.required],
      options: this.daysOfWeek,
    },
    {
      key: 'startTime',
      label: 'Hora de inicio (HH:mm)',
      type: 'text',
      required: true,
      validators: [Validators.required],
    },
    {
      key: 'endTime',
      label: 'Hora de fin (HH:mm)',
      type: 'text',
      required: true,
      validators: [Validators.required],
    },
  ];
  
  get formFields(): FormField[] {
    const fields = [...this.baseFormFields];
    /*
    if (this.formMode === 'edit' && this.doctors.length) {
      fields.unshift({
        key: 'doctorId',
        label: 'Doctor',
        type: 'select',
        required: true,
        validators: [Validators.required],
        options: this.doctors
          .filter((d) => d.is_active)
          .map((d) => ({
            value: d.id,
            label: `${d.first_name} ${d.last_name}`,
          })),
      });
    }
    */
    return fields; 
  }

  initialData: any = null;

  private updateInitialData(): void {
    if (!this.selectedSchedule) {
      this.initialData = null;
      return;
    }

    const dayIndex = this.englishDays.indexOf(this.selectedSchedule.day);
    const dayValue = dayIndex >= 0 ? dayIndex.toString() : '';

    this.initialData = {
      day: dayValue,
      startTime: this.selectedSchedule.start_time || '',
      endTime: this.selectedSchedule.end_time || '',
    };
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      schedules: this.scheduleService.getSchedules(),
      doctors: this.doctorService.getDoctors(),
    }).subscribe({
      next: ({ schedules, doctors }) => {
        this.doctors = doctors;
        this.schedules = schedules.map((s) => ({
          ...s,
          doctorName: this.getDoctorName(s.doctors?.[0]) || 'N/A',
        }));
        this.loading = false;
      },
      error: (err: HttpErrorResponse) =>
        this.handleError(err, 'Error cargando datos'),
    });
  }

  private getDoctorName(id?: string): string {
    const d = this.doctors.find((x) => x.id === id);
    return d ? `${d.first_name} ${d.last_name}` : 'N/A';
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedSchedule = null;
    this.updateInitialData();
    this.showForm = true;
  }

  onEdit(schedule: ExtendedSchedule): void {
    this.formMode = 'edit';
    this.selectedSchedule = { ...schedule };
    this.updateInitialData();
    this.showForm = true;
  }

  onDelete(schedule: ExtendedSchedule): void {
    const idx = this.englishDays.indexOf(schedule.day);
    const dayLabel = this.daysOfWeek[idx]?.label ?? schedule.day;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Horario',
        message: `¿Eliminar horario de ${schedule.doctorName} el ${dayLabel}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && schedule.id) {
        this.loading = true;
        this.scheduleService.deleteSchedule(schedule.id).subscribe({
          next: () => {
            this.schedules = this.schedules.filter((s) => s.id !== schedule.id);
            this.loading = false;
            this.logger.info(`Horario eliminado correctamente`);
          },
          error: (err: HttpErrorResponse) =>
            this.handleError(
              err,
              `Error al eliminar el horario de ${schedule.doctorName}`
            ),
        });
      }
    });
  }

  onView(schedule: ExtendedSchedule): void {
    alert(`
      Doctor: ${schedule.doctorName}
      Día: ${this.daysOfWeek.find((d) => d.value === schedule.day)?.label}
      Hora: ${schedule.start_time} - ${schedule.end_time}
    `);
  }

  onFormSubmit(formData: ScheduleFormData): void {
    this.formLoading = true;
    this.error = null;

    const idx = parseInt(formData.day, 10);
    const dayName = this.englishDays[idx];

    if (!this.isValidTimeRange(formData.startTime, formData.endTime)) {
      this.error = 'La hora de fin debe ser posterior a la de inicio.';
      this.formLoading = false;
      return;
    }

    if (this.formMode === 'create') {
      const payload: MedicalScheduleCreate = {
        day: dayName,
        start_time: formData.startTime,
        end_time: formData.endTime,
      };
      this.scheduleService.addSchedule(payload).subscribe({
        next: (s) => this.onSaveSuccess(s, 'Horario creado correctamente'),
        error: (err) => this.handleError(err, 'Error creando horario'),
      });
    } else if (this.selectedSchedule) {
      const payload: MedicalScheduleUpdate = {
        id: this.selectedSchedule.id,
        day: dayName,
        start_time: formData.startTime,
        end_time: formData.endTime,
      };
      this.scheduleService.updateSchedule(payload).subscribe({
        next: (s) => this.onSaveSuccess(s, 'Horario actualizado correctamente'),
        error: (err) => this.handleError(err, 'Error actualizando horario'),
      });
    }
  }

  private onSaveSuccess(schedule: MedicalSchedule, message: string) {
    const ext: ExtendedSchedule = {
      ...schedule,
      doctorName: this.getDoctorName(schedule.doctors?.[0]) || 'N/A',
    };
    const i = this.schedules.findIndex((x) => x.id === ext.id);
    if (i > -1) this.schedules[i] = ext;
    else this.schedules.push(ext);

    this.logger.info(message);
    this.formLoading = false;
    this.showForm = false;
  }

  private isValidTimeRange(s: string, e: string): boolean {
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    return eh * 60 + em > sh * 60 + sm;
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedSchedule = null;
  }

  private handleError(error: HttpErrorResponse, defaultMsg: string) {
    this.logger.error(defaultMsg, error);
    if (error.status === 422 && error.error?.detail) {
      const d = error.error.detail;
      this.error = Array.isArray(d)
        ? d.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join('; ')
        : d;
    } else {
      this.error = error.error?.detail || error.error?.message || defaultMsg;
    }
    this.formLoading = false;
    this.loading = false;
  }
}
