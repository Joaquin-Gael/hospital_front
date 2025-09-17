import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PasswordService } from '../services/password.service';
import { LoggerService } from '../../../../services/core/logger.service';
import { NotificationService } from '../../../../core/notification/services/notification.service';

import { ChangePasswordFormComponent } from '../components/change-password-form/change-password-form.component';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ChangePasswordFormComponent
  ],
  template: `
    <div class="change-password-container">
      <app-change-password-form
        [isSubmitting]="isSubmitting"
        (formSubmit)="handlePasswordChange($event)"
        (formCancel)="handleCancel()"
      />
    </div>
  `,
  styleUrls: ['./change-password.container.scss']
})
export class ChangePasswordContainer implements OnDestroy {
  private readonly passwordService = inject(PasswordService);
  private readonly logger = inject(LoggerService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  isSubmitting = false;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handlePasswordChange(data: ChangePasswordData): void {
    this.isSubmitting = true;
    this.logger.info('Iniciando cambio de contraseña');

    this.passwordService.changePassword(data.currentPassword, data.newPassword)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          this.logger.info('Contraseña cambiada exitosamente', response);
          this.notificationService.success('¡Contraseña cambiada con éxito!', {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
          // Optionally redirect after successful change
          setTimeout(() => {
            this.router.navigate(['/user-panel/profile']);
          }, 2000);
        },
        error: (error) => {
          this.logger.error('Error al cambiar contraseña:', error);
          this.notificationService.error('Error al cambiar la contraseña. Verifica tu contraseña actual e inténtalo nuevamente.', {
            duration: 7000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
        }
      });
  }

  handleCancel(): void {
    this.router.navigate(['/user-panel/profile']);
  }
}