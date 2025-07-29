import { Component, EventEmitter, Output, OnInit, OnDestroy, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { LoggerService } from '../../../services/core/logger.service';
import { Doctor, MedicalSchedule, DoctorUpdate, DoctorUpdateResponse } from '../../../services/interfaces/doctor.interfaces';
import { DoctorDataService } from '../medic-panel/doctor-data.service'; 
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

// Enum para manejar estados de forma más segura
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
  imports: [CommonModule, MatIconModule],
})
export class DoctorProfileComponent implements OnInit, OnDestroy, OnChanges {
  @Output() editProfile = new EventEmitter<void>();
  @Output() updateStatusEvent = new EventEmitter<{ doctor: Doctor; status: DoctorStatus }>();

  // Exponer DoctorStatus para el template
  protected DoctorStatus = DoctorStatus;

  doctor: Doctor | null = null;
  schedules: MedicalSchedule[] = [];
  state: DashboardState = {
    error: null,
    isLoading: true,
    status: DoctorStatus.OFFLINE
  };

  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);
  private readonly doctorDataService = inject(DoctorDataService); // Inyectar el servicio
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.doctorDataService.getDoctor().pipe(takeUntil(this.destroy$)).subscribe(doctor => {
      this.doctor = doctor;
      this.logger.info('Doctor received in DoctorProfileComponent', { doctorId: doctor?.id });
      this.updateDashboardState();
    });

    this.doctorDataService.getSchedules().pipe(takeUntil(this.destroy$)).subscribe(schedules => {
      this.schedules = schedules;
      this.logger.info('Schedules received in DoctorProfileComponent', { schedulesCount: schedules.length });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['doctor'] || changes['schedules']) {
      this.logger.info('DoctorProfileComponent: Datos recibidos', {
        doctorId: this.doctor?.id,
        schedulesCount: this.schedules.length,
      });
      this.updateDashboardState();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDashboardState(): void {
    if (!this.doctor) {
      this.state = { ...this.state, error: 'No se encontraron datos del doctor', isLoading: false };
      return;
    }
    this.state = {
      ...this.state,
      error: null,
      isLoading: false,
      status: this.calculateStatus()
    };
  }

  private calculateStatus(): DoctorStatus {
    if (!this.doctor || this.doctor.is_banned || !this.doctor.is_active) {
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
      is_active: newStatus !== DoctorStatus.OFFLINE
    };

    this.state = { ...this.state, isLoading: true };

    this.doctorService.updateDoctor(this.doctor.id, updateData).subscribe({
      next: (updatedFields: DoctorUpdateResponse) => {
        this.logger.info('Doctor status updated', { doctorId: this.doctor!.id, newStatus });
        this.doctor = { ...this.doctor!, is_active: updateData.is_active! };
        this.state = { ...this.state, status: newStatus, isLoading: false, error: null };
        this.updateStatusEvent.emit({ doctor: this.doctor!, status: newStatus });
      },
      error: (err) => {
        this.state = { ...this.state, error: err.message, isLoading: false };
        this.logger.error('Failed to update doctor status', err);
      },
    });
  }

  onEditProfile(): void {
    this.logger.info('Edit profile triggered');
    this.editProfile.emit();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  todayStats = {
    patients: 12,
    appointments: 8,
    completed: 6,
    pending: 2
  };
}