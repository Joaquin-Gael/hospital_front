import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentViewModel } from '../../../services/interfaces/appointment.interfaces';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class AppointmentsComponent {
  @Input() appointments: AppointmentViewModel[] = [];
  @Output() reschedule = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<string>();
  @Output() newAppointment = new EventEmitter<void>();

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