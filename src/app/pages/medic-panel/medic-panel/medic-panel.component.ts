import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { SpecialityService } from '../../../services/speciality/speciality.service'; 
import { LoggerService } from '../../../services/core/logger.service';
import { StorageService } from '../../../services/core/storage.service';
import { AuthService } from '../../../services/auth/auth.service';
import { PanelUiComponent } from '../panel-ui/panel-ui.component';
import { DoctorDataService } from './doctor-data.service';

@Component({
  selector: 'app-medic-panel',
  templateUrl: './medic-panel.component.html',
  styleUrls: ['./medic-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, PanelUiComponent],
})
export class MedicPanelComponent implements OnInit, OnDestroy {
  private readonly doctorService = inject(DoctorService);
  private readonly specialityService = inject(SpecialityService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);
  private readonly doctorDataService = inject(DoctorDataService);

  error: string | null = null;
  loading = true;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.storageService.getAccessToken()) {
      this.logger.info('No auth token found, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }

    forkJoin({
      doctorResponse: this.doctorService.getMe(),
      specialities: this.specialityService.getSpecialities(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loading = false;
          const { doctorResponse, specialities } = result;

          if (!doctorResponse.doc) {
            this.error = 'No se encontraron datos del doctor';
            this.logger.error('No doctor data found');
            this.router.navigate(['/home']);
            return;
          }

          this.doctorDataService.setDoctor(doctorResponse.doc);
          this.doctorDataService.setSchedules(doctorResponse.schedules || []);
          this.doctorDataService.setSpecialities(specialities);
          this.logger.info('Doctor and specialities data loaded', {
            doctorId: doctorResponse.doc.id,
            specialitiesCount: specialities.length,
          });
        },
        error: (err) => {
          this.error = 'Error al cargar los datos';
          this.loading = false;
          this.logger.error('Failed to load data', err);
          this.router.navigate(['/home']);
        },
      });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.logger.info('Logout successful, redirecting to /login');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.logger.error('Logout failed, redirecting to /login', err);
        this.router.navigate(['/login']);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}