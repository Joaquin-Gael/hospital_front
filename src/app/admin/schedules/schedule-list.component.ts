import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ActionButton } from '../section-header/section-header.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { ViewDialogComponent, ViewDialogColumn } from '../../shared/view-dialog/view-dialog.component';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';
import {
  EntityFormComponent,
  EntityFormPayload,
  FormField,
} from '../../shared/entity-form/entity-form.component';
import { ScheduleService } from '../../services/schedule/schedule.service';
import { DoctorService } from '../../services/doctor/doctor.service';
import { LoggerService } from '../../services/core/logger.service';
import { NotificationService } from '../../core/notification';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { AssignDoctorScheduleComponent } from './assign-doctor-schedule.component';
import { MedicalScheduleCreate, MedicalScheduleUpdate } from '../../services/interfaces/hospital.interfaces';
import { MedicalSchedule, Doctor } from '../../services/interfaces/doctor.interfaces';

interface ExtendedSchedule extends MedicalSchedule {
  doctorName: string;
}

type ScheduleFormValues = EntityFormPayload & {
  day: string;
  startTime: string;
  endTime: string;
};

@Component({
  selector: 'app-schedule-list',
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
  ],
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.scss'],
})
export class ScheduleListComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private doctorService = inject(DoctorService);
  private logger = inject(LoggerService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  schedules: ExtendedSchedule[] = [];
  doctors: Doctor[] = [];
  loading = false;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedSchedule: ExtendedSchedule | null = null;
  formLoading = false;
  error: string | null = null;

  viewDialogOpen = false;
  viewDialogData: any = {};
  viewDialogTitle = '';

  headerActions: ActionButton[] = [
    {
      label: 'Asociar Doctor',
      icon: 'link',
      variant: 'success',
      ariaLabel: 'Asociar doctor a horario',
      onClick: () => this.openAssignDoctorDialog()
    },
    {
      label: 'Nuevo Horario',
      icon: 'add',
      variant: 'primary',
      ariaLabel: 'Agregar nuevo horario',
      onClick: () => this.onAddNew()
    }
  ];

  readonly daysOfWeek = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
  ];

  private readonly englishDays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  private readonly daysMap: Record<string, string> = {
    'Sunday': 'Domingo',
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado'
  };

  tableColumns: TableColumn[] = [
    {
      key: 'day',
      label: 'Día',
      sortable: true,
      format: (value: string) => this.daysMap[value] || value
    },
    { 
      key: 'start_time', 
      label: 'Hora Inicio',
      sortable: true
    },
    { 
      key: 'end_time', 
      label: 'Hora Fin',
      sortable: true
    },
    { 
      key: 'doctorName', 
      label: 'Doctor Asignado',
      sortable: true
    },
  ];

  viewDialogColumns: ViewDialogColumn[] = [
    { 
      key: 'day', 
      label: 'Día', 
      format: (value: string) => this.daysMap[value] || value 
    },
    { key: 'start_time', label: 'Hora Inicio' },
    { key: 'end_time', label: 'Hora Fin' },
    { key: 'doctorName', label: 'Doctor Asignado' },
  ];

  private baseFormFields: FormField<ScheduleFormValues>[] = [
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
      label: 'Hora de inicio',
      type: 'text',
      required: true,
      validators: [
        Validators.required, 
        Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      ],
      placeholder: 'HH:mm (ej: 09:00)'
    },
    {
      key: 'endTime',
      label: 'Hora de fin',
      type: 'text',
      required: true,
      validators: [
        Validators.required, 
        Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      ],
      placeholder: 'HH:mm (ej: 18:00)'
    }
  ];

  formInitialData: Partial<ScheduleFormValues> | null = null;

  private _formFields: FormField<ScheduleFormValues>[] = [];
  get formFields(): FormField<ScheduleFormValues>[] {
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
          doctorName: this.getDoctorName(s.doctors?.[0]) || 'Sin asignar'
        }));
        this.loading = false;
        this.logger.info(`Cargados ${this.schedules.length} horarios`);
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Error al cargar los horarios');
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
        
        this.notificationService.success('¡Doctor asociado correctamente!', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
        
        this.loadData();
      } else if (result?.error) {
        this.error = result.error;
        
        this.notificationService.error('Ocurrió un error al asociar el doctor', {
          duration: 7000,
          action: {
            label: 'Cerrar',
            action: () => this.notificationService.dismissAll(),
          },
        });
      }
    });
  }

  onAddNew(): void {
    this.formMode = 'create';
    this.selectedSchedule = null;
    this.formInitialData = null;
    this.showForm = true;
    this.logger.debug('Opening form for new schedule');
  }

  onEdit(schedule: ExtendedSchedule): void {
    this.formMode = 'edit';
    this.selectedSchedule = { ...schedule };
    
    const dayIndex = this.englishDays.indexOf(schedule.day);
    this.formInitialData = {
      day: dayIndex >= 0 ? dayIndex.toString() : '',
      startTime: schedule.start_time ?? '',
      endTime: schedule.end_time ?? ''
    };
    
    this.showForm = true;
    this.logger.debug('Opening form for editing schedule', schedule);
  }

  onDelete(schedule: ExtendedSchedule): void {
    const dayLabel = this.daysMap[schedule.day] || schedule.day;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Horario',
        message: `¿Está seguro de eliminar el horario del ${dayLabel} de ${schedule.start_time} a ${schedule.end_time}?`
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loading = true;
        
        this.scheduleService.deleteSchedule(schedule.id).subscribe({
          next: () => {
            this.schedules = this.schedules.filter(s => s.id !== schedule.id);
            this.loading = false;
            this.logger.info(`Horario eliminado correctamente`);
            
            this.notificationService.success('¡Horario eliminado correctamente!', {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
          },
          error: (err: HttpErrorResponse) => {
            this.handleError(err, 'Error al eliminar el horario');
            this.loading = false;
            
            this.notificationService.error('Ocurrió un error al eliminar el horario', {
              duration: 7000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
          }
        });
      }
    });
  }

  onView(schedule: ExtendedSchedule): void {
    const dayLabel = this.daysMap[schedule.day] || schedule.day;
    this.viewDialogData = schedule;
    this.viewDialogTitle = `Horario: ${dayLabel} ${schedule.start_time}-${schedule.end_time}`;
    this.viewDialogOpen = true;
    this.logger.debug('Opening view dialog for schedule', schedule);
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.viewDialogData = {};
  }

  onFormSubmit(formData: ScheduleFormValues): void {
    if (!this.validateTimes(formData.startTime, formData.endTime)) {
      this.error = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }

    this.formLoading = true;
    this.error = null;

    const dayName = this.englishDays[+formData.day];

    if (this.formMode === 'create') {
      const scheduleData: MedicalScheduleCreate = {
        day: dayName,
        start_time: formData.startTime.trim(),
        end_time: formData.endTime.trim()
      };

      this.scheduleService.addSchedule(scheduleData).subscribe({
        next: (newSchedule: MedicalSchedule) => {
          this.schedules = [...this.schedules, {
            ...newSchedule,
            doctorName: 'Sin asignar'
          }];
          
          this.formLoading = false;
          this.showForm = false;
          this.formInitialData = null;
          
          this.logger.info('Horario creado correctamente');
          this.notificationService.success('¡Horario creado correctamente!', {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err, 'Error al crear el horario');
          this.formLoading = false;
          
          this.notificationService.error('Ocurrió un error al crear el horario', {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
        }
      });
    } else if (this.selectedSchedule) {
      const scheduleData: MedicalScheduleUpdate = {
        id: this.selectedSchedule.id,
        day: dayName,
        start_time: formData.startTime.trim(),
        end_time: formData.endTime.trim()
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
          this.selectedSchedule = null;
          this.formInitialData = null;
          
          this.logger.info('Horario actualizado correctamente');
          this.notificationService.success('¡Horario actualizado correctamente!', {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err, 'Error al actualizar el horario');
          this.formLoading = false;
          
          this.notificationService.error('Ocurrió un error al actualizar el horario', {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
        }
      });
    }
  }

  onFormCancel(): void {
    this.showForm = false;
    this.selectedSchedule = null;
    this.formInitialData = null;
    this.logger.debug('Form cancelled');
  }

  private getDoctorName(doctorId?: string): string {
    if (!doctorId) return '';
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.first_name} ${doctor.last_name}` : '';
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
      errorMessage = Array.isArray(details)
        ? details.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('; ')
        : details || defaultMessage;
    } else {
      errorMessage = error.error?.detail || error.error?.message || error.message || defaultMessage;
    }
    
    this.error = errorMessage;
  }
}