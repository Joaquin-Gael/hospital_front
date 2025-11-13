import { Component, Inject, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DateSelectionComponent } from '../../shifts/date-selection/date-selection.component';
import { TimeSelectionComponent } from '../../shifts/time-selection/time-selection.component';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { MedicalScheduleCreate, MedicalScheduleDaysResponse } from '../../../services/interfaces/hospital.interfaces';
import { TurnRescheduleRequest, RescheduleTurnDialogData } from '../../../services/interfaces/appointment.interfaces';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reschedule-turn-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    DateSelectionComponent,
    TimeSelectionComponent
  ],
  templateUrl: './reschedule-turn-dialog.component.html',
  styleUrls: ['./reschedule-turn-dialog.component.scss'],
})
export class RescheduleTurnDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RescheduleTurnDialogComponent>);
  private readonly scheduleService = inject(ScheduleService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  availableDays: string[] = [];
  availableTimeSlots: string[] = [];
  schedules: MedicalScheduleCreate[] = [];
  isLoading = true;
  error: string | null = null;
  minDate = new Date();

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: RescheduleTurnDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (!this.data.specialtyId) {
      this.error = 'No se proporcionó la especialidad';
      this.isLoading = false;
      console.error('Missing specialtyId in dialog data');
      return;
    }
    
    this.loadAvailableDays(this.data.specialtyId);
    this.watchFormChanges();
  }

  private initForm(): void {
    let dateValue = null;
    if (this.data?.currentDate) {
      const dateParts = this.data.currentDate.split('-');
      if (dateParts.length === 3) {
        dateValue = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2])
        );
      }
    }

    this.form = this.fb.group({
      appointmentDate: [dateValue, Validators.required],
      appointmentTime: [this.data?.currentTime?.substring(0, 5) ?? '', Validators.required],
      reason: ['']
    });
  }

  private watchFormChanges(): void {
    this.form.get('appointmentDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(date => {
        if (date) {
          this.generateTimeSlots(date);
        } else {
          this.availableTimeSlots = [];
          this.form.get('appointmentTime')?.setValue(null);
        }
      });
  }

  private loadAvailableDays(specialtyId: string): void {
    console.log('🔍 Loading schedules for specialty:', specialtyId);
    
    this.scheduleService.getAvailableDays(specialtyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MedicalScheduleDaysResponse) => {
          console.log('✅ Specialty schedules loaded:', response);
          
          this.schedules = response.available_days.map(day => ({
            day: day.day,
            start_time: day.start_time,
            end_time: day.end_time
          }));
          
          this.availableDays = [...new Set(this.schedules.map(s => s.day))];
          this.isLoading = false;

          console.log('📅 Available days:', this.availableDays);

          const currentDate = this.form.get('appointmentDate')?.value;
          if (currentDate) {
            this.generateTimeSlots(currentDate);
          }
        },
        error: (err) => {
          console.error('❌ Error loading schedules:', err);
          this.error = 'Error al cargar los horarios disponibles';
          this.isLoading = false;
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
    console.log('🗓️ Selected date:', date, '→ Day:', englishDay);
    
    const matchingSchedules = this.schedules.filter(
      s => s.day.toLowerCase() === englishDay.toLowerCase()
    );

    console.log('🔍 Matching schedules for', englishDay, ':', matchingSchedules);

    if (!matchingSchedules.length) {
      this.availableTimeSlots = [];
      this.form.get('appointmentTime')?.setValue(null);
      console.warn('⚠️ No schedules found for', englishDay);
      return;
    }

    const allSlots = matchingSchedules.flatMap(schedule =>
      this.generateTimeIntervals(schedule.start_time, schedule.end_time, date)
    );
    
    this.availableTimeSlots = [...new Set(allSlots)].sort((a, b) => a.localeCompare(b));
    console.log('⏰ Available time slots:', this.availableTimeSlots);
  }

  private generateTimeIntervals(
    startTime: string,
    endTime: string,
    selectedDate: Date,
    intervalMinutes = 30
  ): string[] {
    const slots: string[] = [];
    const [startHours, startMinutes] = startTime.split(':').slice(0, 2).map(Number);
    const [endHours, endMinutes] = endTime.split(':').slice(0, 2).map(Number);
    
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);

    const today = new Date();
    const isToday = this.isSameDay(selectedDate, today);

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

  private isSameDay(date1: Date, date2: Date): boolean {
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
    if (date < today) return false;

    if (!this.availableDays.length) return false;

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
    
    return this.availableDays.some(day => day.toLowerCase() === englishDay.toLowerCase());
  };

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const sanitizedReason = typeof formValue.reason === 'string' && 
                           formValue.reason.trim().length > 0 
                           ? formValue.reason.trim() 
                           : undefined;

    const payload: TurnRescheduleRequest = {
      date: this.formatDateISO(formValue.appointmentDate),
      time: this.ensureSeconds(formValue.appointmentTime),
      ...(sanitizedReason ? { reason: sanitizedReason } : {})
    };

    console.log('📤 Submitting reschedule request:', payload);
    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  private formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private ensureSeconds(time: string): string {
    if (!time) return time;
    return time.length === 5 ? `${time}:00` : time;
  }

  get dateControl() {
    return this.form.get('appointmentDate') as FormControl;
  }

  get timeControl() {
    return this.form.get('appointmentTime') as FormControl;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}