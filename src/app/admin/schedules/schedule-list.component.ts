import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../shared/data-table/data-table.component';
import { EntityFormComponent, FormField } from '../shared/entity-form/entity-form.component';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { DoctorService } from '../../services/doctor/doctor.service';
import { LoggerService } from '../../services/core/logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { AssignDoctorScheduleComponent } from './assign-doctor-schedule.component';
import { MedicalScheduleCreate, MedicalScheduleUpdate } from '../../services/interfaces/hospital.interfaces';
import { MedicalSchedule, Doctor } from '../../services/interfaces/doctor.interfaces';

// Interfaz extendida para incluir el nombre del doctor en la visualización
interface ExtendedSchedule extends MedicalSchedule {
  doctorName: string;
}

interface ScheduleFormData {
  day: string;
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
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  tableColumns = [
    {
      key: 'day',
      label: 'Día',
      format: (value: string) => this.getDayLabel(value)
    },
    { key: 'start_time', label: 'Hora Inicio' },
    { key: 'end_time', label: 'Hora Fin' },
    //{ key: 'doctorName', label: 'Doctor' }
  ];

  private baseFormFields: FormField[] = [
    {
      key: 'day',
      label: 'Día de la semana',
      type: 'select',
      required: true,
      validators: [Validators.required],
      options: this.daysOfWeek
    },
    {
      key: 'startTime',
      label: 'Hora de inicio (HH:mm)',
      type: 'text',
      required: true,
      validators: [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]
    },
    {
      key: 'endTime',
      label: 'Hora de fin (HH:mm)',
      type: 'text',
      required: true,
      validators: [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]
    }
  ];

  initialData: Partial<ScheduleFormData> = {};

  private _formFields: FormField[] = [];
  get formFields(): FormField[] {
    if (this._formFields.length === 0) {
      this._formFields = [...this.baseFormFields];
    }
    return this._formFields;
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      schedules: this.scheduleService.getSchedules(),
      doctors: this.doctorService.getDoctors()
    }).subscribe({
      next: ({ schedules, doctors }) => {
        this.doctors = doctors;
        this.schedules = schedules.map((s: MedicalSchedule) => ({
          ...s,
          doctorName: this.getDoctorName(s.doctors?.[0]) || 'N/A'
        }));
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error cargando datos');
        this.loading = false;
      }
    });
  }

  openAssignDoctorDialog(schedule?: ExtendedSchedule): void {
    const dialogRef = this.dialog.open(AssignDoctorScheduleComponent, {
      data: {
        context: 'schedule',
        scheduleId: schedule?.id,
        doctors: this.doctors.filter(d => d.is_active),
        schedules: this.schedules
      },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: { success?: boolean; error?: string } | undefined) => {
      if (result?.success) {
        this.error = null;
        this.logger.info('Doctor asociado a horario correctamente');
        this.loadData();
      } else if (result?.error) {
        this.error = result.error;
      }
    });
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Horario',
        message: `¿Está seguro de eliminar el horario "${this.getDayLabel(schedule.day)} ${schedule.start_time}-${schedule.end_time}"?`
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        this.scheduleService.deleteSchedule(schedule.id).subscribe({
          next: () => {
            this.schedules = this.schedules.filter(s => s.id !== schedule.id);
            this.loading = false;
            this.logger.info(`Horario "${schedule.day} ${schedule.start_time}-${schedule.end_time}" eliminado correctamente`);
          },
          error: (err: HttpErrorResponse) => {
            this.handleError(err, 'Error al eliminar el horario');
            this.loading = false;
          }
        });
      }
    });
  }

  onView(schedule: ExtendedSchedule): void {
    alert(`Detalles del horario:\nDía: ${this.getDayLabel(schedule.day)}\nHora Inicio: ${schedule.start_time}\nHora Fin: ${schedule.end_time}\nDoctor: ${schedule.doctorName}`);
  }

  onFormSubmit(formData: ScheduleFormData): void {
    if (!this.validateTimes(formData.startTime, formData.endTime)) {
      this.error = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.formMode === 'create' ? 'Crear Horario' : 'Actualizar Horario',
        message: `¿Está seguro de ${this.formMode === 'create' ? 'crear' : 'actualizar'} el horario para el ${this.getDayLabel(this.englishDays[+formData.day])} de ${formData.startTime} a ${formData.endTime}?`
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;

      this.formLoading = true;
      this.error = null;

      if (this.formMode === 'create') {
        const scheduleData: MedicalScheduleCreate = {
          day: this.englishDays[+formData.day],
          start_time: formData.startTime,
          end_time: formData.endTime
        };

        this.scheduleService.addSchedule(scheduleData).subscribe({
          next: (newSchedule: MedicalSchedule) => {
            this.schedules.push({
              ...newSchedule,
              doctorName: 'N/A'
            });
            this.formLoading = false;
            this.showForm = false;
            this.logger.info(`Horario "${scheduleData.day} ${scheduleData.start_time}-${scheduleData.end_time}" creado correctamente`);
          },
          error: (err: HttpErrorResponse) => {
            this.handleError(err, 'Error al crear el horario');
            this.formLoading = false;
          }
        });
      } else if (this.selectedSchedule) {
        const scheduleData: MedicalScheduleUpdate = {
          id: this.selectedSchedule.id,
          day: this.englishDays[+formData.day],
          start_time: formData.startTime,
          end_time: formData.endTime
        };

        this.scheduleService.updateSchedule(scheduleData).subscribe({
          next: (updatedSchedule: MedicalSchedule) => {
            const index = this.schedules.findIndex(s => s.id === this.selectedSchedule!.id);
            if (index !== -1) {
              this.schedules[index] = {
                ...updatedSchedule,
                doctorName: this.schedules[index].doctorName
              };
            }
            this.formLoading = false;
            this.showForm = false;
            this.logger.info(`Horario "${scheduleData.day} ${scheduleData.start_time}-${scheduleData.end_time}" actualizado correctamente`);
          },
          error: (err: HttpErrorResponse) => {
            this.handleError(err, 'Error al actualizar el horario');
            this.formLoading = false;
          }
        });
      }
    });
  }

  onFormCancel(): void {
    this.showForm = false;
  }

  private updateInitialData(): void {
    if (this.formMode === 'edit' && this.selectedSchedule) {
      const dayIndex = this.englishDays.indexOf(this.selectedSchedule.day);
      this.initialData = {
        day: dayIndex >= 0 ? dayIndex.toString() : '',
        startTime: this.selectedSchedule.start_time,
        endTime: this.selectedSchedule.end_time
      };
    } else {
      this.initialData = {};
    }
  }

  private getDoctorName(doctorId?: string): string {
    if (!doctorId) return '';
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.first_name} ${doctor.last_name}` : '';
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

  private validateTimes(startTime: string, endTime: string): boolean {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return start < end;
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.logger.error('Error en ScheduleListComponent:', error);
    let errorMessage = defaultMessage;
    if (error.status === 422 && error.error?.detail) {
      const details = error.error.detail;
      if (Array.isArray(details)) {
        errorMessage = details.map((err: any) => `${err.loc.join('.')} (${err.type}): ${err.msg}`).join('; ');
      } else {
        errorMessage = details || defaultMessage;
      }
    } else {
      errorMessage = error.error?.detail || error.error?.message || error.message || defaultMessage;
    }
    this.error = errorMessage;
  }
}