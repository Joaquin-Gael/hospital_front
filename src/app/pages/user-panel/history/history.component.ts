import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentViewModel } from '../../../services/interfaces/appointment.interfaces';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HistoryComponent {
  @Input() appointments: AppointmentViewModel[] = [];
  @Input() loading: boolean = false;
  @Output() viewDetails = new EventEmitter<AppointmentViewModel>();
  @Output() downloadReceipt = new EventEmitter<AppointmentViewModel>();

  get filteredAppointments(): AppointmentViewModel[] {
    return this.appointments;
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  onViewDetails(appointment: AppointmentViewModel): void {
    this.viewDetails.emit(appointment);
  }

  onDownloadReceipt(appointment: AppointmentViewModel): void {
    this.downloadReceipt.emit(appointment);
  }

  trackById(index: number, item: AppointmentViewModel): string {
    return item.id;
  }
}