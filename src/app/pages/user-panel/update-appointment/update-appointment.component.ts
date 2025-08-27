import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { DateSelectionComponent } from '../../shifts/date-selection/date-selection.component';
import { TimeSelectionComponent } from '../../shifts/time-selection/time-selection.component';
import { AppointmentViewModel, Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { MedicalScheduleDaysResponse, MedicalScheduleCreate } from '../../../services/interfaces/hospital.interfaces';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-update-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateSelectionComponent,
    TimeSelectionComponent
  ],
  templateUrl: './update-appointment.component.html',
  styleUrls: ['./update-appointment.component.scss']
})
export class UpdateAppointmentComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private scheduleService = inject(ScheduleService);
  private logger = inject(LoggerService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  appointmentForm!: FormGroup;
  appointment: AppointmentViewModel | null = null;
  availableDays: string[] = [];
  availableTimeSlots: string[] = [];
  schedules: MedicalScheduleCreate[] = [];
  isLoading = true;
  error: string | null = null;
  minDate = new Date();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.loadAppointment();
    this.watchFormChanges();
  }

  private initForm(): void {
    this.appointmentForm = this.fb.group({
      appointmentDate: [null, Validators.required],
      appointmentTime: [null, Validators.required]
    });
  }

  private watchFormChanges(): void {
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.generateTimeSlots(date);
      } else {
        this.availableTimeSlots = [];
        this.appointmentForm.get('appointmentTime')?.setValue(null);
      }
      this.cdr.detectChanges();
    });
  }

  private loadAppointment(): void {
    const appointmentId = this.route.snapshot.paramMap.get('id');
    if (!appointmentId) {
      this.notificationService.error('No se proporcionó un ID de turno');
      this.router.navigate(['/user-panel']);
      return;
    }

    this.appointmentService.getTurnById(appointmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turn: Turn) => {
          this.appointment = this.mapTurnToAppointment(turn);
          if (turn.service?.[0]?.specialty_id) {
            this.loadAvailableDays(turn.service[0].specialty_id);
          } else {
            this.error = 'No se encontró la especialidad para este turno';
            this.isLoading = false;
            this.router.navigate(['/user-panel']);
          }
        },
        error: (err) => {
          this.logger.error('Error al cargar el turno', err);
          this.notificationService.error('Error al cargar los datos del turno');
          this.isLoading = false;
          this.router.navigate(['/user-panel']);
        }
      });
  }

  private mapTurnToAppointment(turn: Turn): AppointmentViewModel {
    return {
      id: turn.appointment_id ?? turn.id,
      turnId: turn.id,
      date: turn.date,
      time: turn.time.split(':').slice(0, 2).join(':'),
      specialty: turn.service?.[0]?.name ?? 'Sin especialidad',
      doctorName: turn.doctor ? `${turn.doctor.first_name} ${turn.doctor.last_name}`.trim() : 'Sin médico asignado',
      state: turn.state
    };
  }

  private loadAvailableDays(specialtyId: string): void {
    const minLoadingTime = 500;
    const startTime = Date.now();

    this.scheduleService.getAvailableDays(specialtyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MedicalScheduleDaysResponse) => {
          this.schedules = response.available_days.map(day => ({
            day: day.day,
            start_time: day.start_time,
            end_time: day.end_time
          }));
          this.availableDays = [...new Set(this.schedules.map(s => s.day))];
          const elapsedTime = Date.now() - startTime;
          const remainingTime = minLoadingTime - elapsedTime;
          setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }, remainingTime > 0 ? remainingTime : 0);
        },
        error: (err) => {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = minLoadingTime - elapsedTime;
          setTimeout(() => {
            this.isLoading = false;
            this.error = 'Error al cargar los días disponibles';
            this.notificationService.error(this.error);
            this.router.navigate(['/user-panel']);
          }, remainingTime > 0 ? remainingTime : 0);
        }
      });
  }

  private generateTimeSlots(date: Date): void {
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const dayMap: { [key: string]: string } = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };
    const englishDay = dayMap[dayOfWeek] || '';
    const matchingSchedules = this.schedules.filter(s => s.day.toLowerCase() === englishDay.toLowerCase());

    if (!matchingSchedules.length) {
      this.availableTimeSlots = [];
      this.appointmentForm.get('appointmentTime')?.setValue(null);
      return;
    }

    const allSlots = matchingSchedules.flatMap(schedule =>
      this.generateTimeIntervals(schedule.start_time, schedule.end_time)
    );
    this.availableTimeSlots = [...new Set(allSlots)].sort((a, b) => a.localeCompare(b));
    this.appointmentForm.get('appointmentTime')?.setValue(null);
  }

  private generateTimeIntervals(startTime: string, endTime: string, intervalMinutes = 30): string[] {
    const slots: string[] = [];
    const [startHours, startMinutes] = startTime.split(':').slice(0, 2).map(Number);
    const [endHours, endMinutes] = endTime.split(':').slice(0, 2).map(Number);
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);
    const today = new Date();
    const isToday = this.isSameDay(this.appointmentForm.get('appointmentDate')?.value, today);

    let current = start;
    if (isToday) {
      const now = new Date();
      if (now > start) {
        const minutes = now.getMinutes();
        const nextInterval = Math.ceil((minutes + 1) / intervalMinutes) * intervalMinutes;
        current.setHours(now.getHours(), nextInterval, 0, 0);
      }
    }

    while (current < end) {
      slots.push(this.formatTime(current));
      current = new Date(current.getTime() + intervalMinutes * 60 * 1000);
    }
    return slots;
  }

  private isSameDay(date1: Date | null, date2: Date): boolean {
    if (!date1) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
  }

  dayFilter = (date: Date | null): boolean => {
    if (!date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return false;
    }

    if (!this.availableDays.length) {
      return false;
    }

    const dayMap: { [key: string]: string } = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const englishDay = dayMap[dayOfWeek] || '';
    return this.availableDays.includes(englishDay);
  };

  /*
  onSubmit(): void {
    if (this.appointmentForm.invalid || !this.appointment) {
      this.markFormGroupTouched(this.appointmentForm);
      this.notificationService.error('Por favor, completa todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    const formValue = this.appointmentForm.value;
    const updatedTurnData = {
      date: this.formatDateISO(formValue.appointmentDate),
      time: formValue.appointmentTime,
      state: 'waiting' as TurnState
    };

    this.appointmentService.updateTurn(this.appointment.turnId, updatedTurnData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Turno reprogramado con éxito');
          this.router.navigate(['/user-panel']);
          this.isLoading = false;
        },
        error: (err: any) => {
          this.logger.error('Error al reprogramar el turno', err);
          this.notificationService.error('Error al reprogramar el turno');
          this.isLoading = false;
        }
      });
  }
  */

  private formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  get dateControl(): FormControl {
    return this.appointmentForm.get('appointmentDate') as FormControl;
  }

  get timeControl(): FormControl {
    return this.appointmentForm.get('appointmentTime') as FormControl;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}