import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentViewModel } from '../../../services/interfaces/appointment.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { LoggerService } from '../../../services/core/logger.service';
import { Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  @Input() appointments: AppointmentViewModel[] = [];
  @Input() user: UserRead | null = null;
  @Output() reschedule = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<string>();
  @Output() newAppointment = new EventEmitter<void>();

  private readonly appointmentService = inject(AppointmentService);
  private readonly logger = inject(LoggerService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
  }

  getDayNumber(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  }

  getMonthName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'long' }).toLowerCase();
  }

  onReschedule(appointmentId: string): void {
    this.reschedule.emit(appointmentId);
  }

  onCancel(turnId: string): void {
    this.cancel.emit(turnId);
  }
}