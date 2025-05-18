import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { DoctorMeResponse, Doctor, MedicalSchedule } from '../../../services/interfaces/doctor.interfaces';
import { DoctorProfileComponent } from '../doctor-profile/doctor-profile.component';
import { AppointmentScheduleComponent } from '../appointment-schedule/appointment-schedule.component';
import { PatientDetailComponent } from '../patient-detail/patient-detail.component';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { TaskListComponent } from '../task-list/task-list.component';
import { ElectronicPrescriptionComponent } from '../electronic-prescription/electronic-prescription.component';
import { StudyRequestComponent } from '../study-request/study-request.component';
import { MedicalHistoryComponent } from '../medical-history/medical-history.component';
import { PanelUiComponent } from '../panel-ui/panel-ui.component';
import { PatientsComponent } from '../patients/patients.component';
import { ScheduleComponent } from '../schedule/schedule.component';
import { RecordsComponent } from '../records/records.component';
import { MessagesComponent } from '../messages/messages.component';
import { StatisticsComponent } from '../statistics/statistics.component';
import { SettingsComponent } from '../settings/settings.component';

@Component({
  selector: 'app-medic-panel',
  templateUrl: './medic-panel.component.html',
  styleUrls: ['./medic-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DoctorProfileComponent,
    AppointmentScheduleComponent,
    PatientDetailComponent,
    NotificationPanelComponent,
    TaskListComponent,
    ElectronicPrescriptionComponent,
    StudyRequestComponent,
    MedicalHistoryComponent,
    PanelUiComponent,
    PatientsComponent,
    ScheduleComponent,
    RecordsComponent,
    MessagesComponent,
    StatisticsComponent,
    SettingsComponent,
  ],
})
export class MedicPanelComponent implements OnInit, OnDestroy {
  private readonly doctorService = inject(DoctorService);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);

  doctor: Doctor | null = null;
  schedules: MedicalSchedule[] = [];
  selectedPatientId: string | null = null;
  activeSection = 'panel';
  error: string | null = null;
  loading = true;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.storageService.getToken()) {
      this.logger.info('No auth token found, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }

    this.doctorService.getMe().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: DoctorMeResponse) => {
        this.doctor = response.doc ? { ...response.doc } : null;
        this.schedules = response.schedules ? [...response.schedules] : [];
        this.loading = false;
        if (!this.doctor) {
          this.error = 'No se encontraron datos del doctor';
          this.logger.error('No doctor data found');
          this.router.navigate(['/login']);
          return;
        }
        this.logger.info('Doctor data loaded', { doctorId: this.doctor.id });
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del doctor';
        this.loading = false;
        this.logger.error('Failed to load doctor', err);
        this.router.navigate(['/login']);
      },
    });
  }

  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId;
    this.error = null;
    this.logger.info('Section changed', { section: sectionId });
  }

  onEditProfile(): void {
    this.logger.info('Edit profile');
    this.activeSection = 'settings';
  }

  onLogout(): void {
    this.storageService.clearStorage();
    this.logger.info('Logout successful, redirecting to /login');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}