import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { HealthInsuranceService } from '../../../services/health_insarunce/health-insurance.service';
import { AppointmentService } from '../../../services/appointment/appointments.service';
import { LoggerService } from '../../../services/core/logger.service';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces';
import { Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../../core/notification';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly healthInsuranceService = inject(HealthInsuranceService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  user: UserRead | null = null;
  healthInsurance: string = 'No disponible';
  lastVisit: Date | null = null;
  error: string | null = null;
  loading: boolean = true;
  private readonly destroy$ = new Subject<void>();
  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    // Cargamos datos del usuario p
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (userRead) => {
        if (!userRead) {
          this.error = 'No se encontraron datos del usuario';
          this.logger.error('No user data found');
          this.router.navigate(['/login']);
          return;
        }
        this.user = userRead;
        this.loading = false;
        this.loadHealthInsurance(userRead.health_insurance[0]);
        this.loadLastVisit(userRead.id);
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Error al cargar los datos del usuario';
        this.loading = false;
        this.logger.error('Failed to load user', err);
        this.router.navigate(['/login']);
      },
    });
  }

  private loadHealthInsurance(healthInsuranceId: string | undefined | null): void {
    if (!healthInsuranceId) {
      this.healthInsurance = 'No disponible';
      return;
    }
    this.healthInsuranceService.getById(healthInsuranceId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (insurance: HealthInsuranceRead) => {
        this.healthInsurance = insurance ? `${insurance.name} (${insurance.discount}% descuento)` : 'No disponible';
      },
      error: (err: HttpErrorResponse) => {
        this.logger.error('Failed to load health insurance', err);
        this.healthInsurance = 'No disponible';
      },
    });
  }

  private loadLastVisit(userId: string): void {
    this.appointmentService.getTurnsByUserId(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (turns: Turn[]) => {
        const completedTurns = turns
          .filter(turn => turn.state === TurnState.FINISHED)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.lastVisit = completedTurns.length > 0 ? new Date(completedTurns[0].date) : null;
      },
      error: (err: HttpErrorResponse) => {
        this.logger.error('Failed to load last visit', err);
        this.lastVisit = null;
      },
    });
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No registrada';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(): string {
    const name = this.user ? `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() : '';
    if (!name || name === 'No disponible') return 'ND';
    return name
      .split(' ')
      .filter(word => word)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  onEditProfile(): void {
    this.router.navigate(['/user_panel/edit-profile']);
  }

  onChangePassword(): void {
    this.notificationService.info('Cambio de contraseña próximamente disponible');
    //this.router.navigate(['/user_panel/change-password']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}