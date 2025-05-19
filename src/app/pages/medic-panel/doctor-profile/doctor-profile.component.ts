import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { LoggerService } from '../../../services/core/logger.service';
import { Doctor, MedicalSchedule, DoctorUpdate } from '../../../services/interfaces/doctor.interfaces';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class DoctorProfileComponent implements OnChanges {
  @Input() doctor: Doctor | null = null;
  @Input() schedules: MedicalSchedule[] = [];
  @Output() editProfile = new EventEmitter<void>();
  @Output() updateStatusEvent = new EventEmitter<{ doctor: Doctor; status: 'available' | 'busy' | 'offline' }>();

  error: string | null = null;

  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['doctor'] || changes['schedules']) {
      this.logger.info('DoctorProfileComponent: Datos recibidos', {
        doctor: this.doctor?.id,
        schedulesCount: this.schedules.length,
      });
      this.error = null;
    }
  }

  getInitials(): string {
    if (!this.doctor || (!this.doctor.first_name && !this.doctor.last_name)) return 'ND';
    const firstInitial = this.doctor.first_name ? this.doctor.first_name.charAt(0).toUpperCase() : '';
    const lastInitial = this.doctor.last_name ? this.doctor.last_name.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  }

  getStatusLabel(): string {
    if (!this.doctor || this.doctor.is_banned || !this.doctor.is_active) {
      return 'Fuera de servicio';
    }
    return 'Disponible'; 
  }

  getStatusClass(): string {
    if (!this.doctor || this.doctor.is_banned || !this.doctor.is_active) {
      return 'status-badge--offline';
    }
    return 'status-badge--available';
  }

  updateStatus(newStatus: 'available' | 'busy' | 'offline'): void {
    if (!this.doctor) {
      this.logger.error('No doctor data for status update');
      return;
    }
    let updateData: DoctorUpdate = {};
    if (newStatus === 'offline') {
      updateData = { is_active: false };
    } else if (newStatus === 'available' || newStatus === 'busy') {
      updateData = { is_active: true };
    }

    this.doctorService.updateDoctor(this.doctor.id, updateData).subscribe({
      next: () => {
        this.logger.info('Doctor status updated', { doctorId: this.doctor!.id, newStatus });
        this.updateStatusEvent.emit({ doctor: this.doctor!, status: newStatus });
      },
      error: (err) => {
        this.error = err.message;
        this.logger.error('Failed to update doctor status', err);
      },
    });
  }

  onEditProfile(): void {
    this.logger.info('Edit profile triggered');
    this.editProfile.emit();
  }
}