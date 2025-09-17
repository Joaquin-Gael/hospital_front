import { Component, EventEmitter, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { LoggerService } from '../../../services/core/logger.service';
import { Doctor, MedicalSchedule, DoctorUpdate, DoctorUpdateResponse } from '../../../services/interfaces/doctor.interfaces';
import { DoctorDataService } from '../medic-panel/doctor-data.service';
import { Observable, Subject, combineLatest, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';

enum DoctorStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

interface DashboardState {
  error: string | null;
  isLoading: boolean;
  status: DoctorStatus;
}

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
})
export class DoctorProfileComponent implements OnInit, OnDestroy {
  @Output() editProfile = new EventEmitter<void>();
  @Output() updateStatusEvent = new EventEmitter<{ doctor: Doctor; status: DoctorStatus }>();

  protected DoctorStatus = DoctorStatus;

  doctor: Doctor | null = null;
  doctorSpecialty$: Observable<string> = new Observable<string>();
  schedules: MedicalSchedule[] = [];
  state: DashboardState = {
    error: null,
    isLoading: true,
    status: DoctorStatus.OFFLINE,
  };

  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);
  private readonly doctorDataService = inject(DoctorDataService);
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);

  ngOnInit(): void {
    combineLatest([
      this.doctorDataService.getDoctor(),
      this.doctorDataService.getSpecialities(),
      this.doctorDataService.getSchedules(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([doctor, specialities, schedules]) => {
          this.doctor = doctor;
          this.schedules = schedules;
          this.doctorSpecialty$ = this.doctorDataService.getSpecialityName(doctor?.speciality_id || '');
          this.state = {
            error: doctor ? null : 'No se encontraron datos del doctor',
            isLoading: false,
            status: this.calculateStatus(doctor),
          };
          this.logger.info('Doctor and schedules loaded', {
            doctorId: doctor?.id,
            schedulesCount: schedules.length,
          });
        },
        error: (err) => {
          this.state = { error: 'Error al cargar los datos', isLoading: false, status: DoctorStatus.OFFLINE };
          this.logger.error('Failed to load data in DoctorProfileComponent', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateStatus(doctor: Doctor | null): DoctorStatus {
    if (!doctor || !doctor.doctor_state) {
      return DoctorStatus.OFFLINE;
    }
    return DoctorStatus.AVAILABLE;
  }

  getInitials(): string {
    if (!this.doctor) return 'ND';
    const firstInitial = this.doctor.first_name?.charAt(0).toUpperCase() ?? '';
    const lastInitial = this.doctor.last_name?.charAt(0).toUpperCase() ?? '';
    return `${firstInitial}${lastInitial}`;
  }

  getStatusLabel(): string {
    switch (this.state.status) {
      case DoctorStatus.AVAILABLE:
        return 'Disponible';
      case DoctorStatus.BUSY:
        return 'En consulta';
      case DoctorStatus.OFFLINE:
        return 'Fuera de servicio';
      default:
        return 'Desconocido';
    }
  }

  getStatusClass(): string {
    switch (this.state.status) {
      case DoctorStatus.AVAILABLE:
        return 'status-badge--available';
      case DoctorStatus.BUSY:
        return 'status-badge--busy';
      case DoctorStatus.OFFLINE:
        return 'status-badge--offline';
      default:
        return 'status-badge--offline';
    }
  }

  updateStatus(newStatus: DoctorStatus): void {
    if (!this.doctor) {
      this.logger.error('No doctor data for status update');
      this.state = { ...this.state, error: 'No hay datos del doctor para actualizar el estado' };
      return;
    }

    if (this.state.status === newStatus) {
      this.logger.info('Estado no cambió, no se requiere actualización', { status: newStatus });
      return;
    }

    const updateData: DoctorUpdate = {
      doctor_state: newStatus,
    };

    this.state = { ...this.state, isLoading: true };

    this.doctorService.updateDoctor(this.doctor.id, updateData).subscribe({
      next: (updatedFields: DoctorUpdateResponse) => {
        const updatedDoctor = { ...this.doctor!, doctor_state: updateData.doctor_state! };
        this.doctorDataService.setDoctor(updatedDoctor);
        this.state = { ...this.state, status: newStatus, isLoading: false, error: null };
        this.updateStatusEvent.emit({ doctor: updatedDoctor, status: newStatus });
        this.logger.info('Doctor status updated', { doctorId: this.doctor!.id, newStatus });
      },
      error: (err) => {
        this.state = { ...this.state, error: err.message, isLoading: false };
        this.logger.error('Failed to update doctor status', err);
      },
    });
  }

  onEditProfile(): void {
    this.router.navigate(['/medic_panel/settings']);
    this.logger.info('Edit profile triggered');
    this.editProfile.emit();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  todayStats = {
    patients: 12,
    appointments: 8,
    completed: 6,
    pending: 2,
  };
}