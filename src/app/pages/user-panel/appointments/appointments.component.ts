import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../models/models';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AppointmentsComponent {
  @Input() appointments: Appointment[] = [];
  @Output() reschedule = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<string>();
  @Output() newAppointment = new EventEmitter<void>();

  getDayName(date: Date): string {
    return date.toLocaleString('es-AR', { weekday: 'long' });
  }

  requestNewAppointment(): void {
    this.newAppointment.emit();
  }

  onReschedule(appointmentId: string): void {
    this.reschedule.emit(appointmentId);
  }

  onCancel(appointmentId: string): void {
    this.cancel.emit(appointmentId);
  }
}