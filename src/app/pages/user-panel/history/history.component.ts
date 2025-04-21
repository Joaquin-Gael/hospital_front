import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../models/models';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HistoryComponent {
  @Input() appointments: Appointment[] = [];
  @Output() viewDetails = new EventEmitter<Appointment>();
  @Output() downloadReceipt = new EventEmitter<Appointment>();

  formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  onViewDetails(appointment: Appointment): void {
    this.viewDetails.emit(appointment);
  }

  onDownloadReceipt(appointment: Appointment): void {
    this.downloadReceipt.emit(appointment);
  }
}