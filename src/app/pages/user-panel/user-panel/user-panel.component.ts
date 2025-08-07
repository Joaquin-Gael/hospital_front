import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { StorageService } from '../../../services/core/storage.service';
import { LoggerService } from '../../../services/core/logger.service';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from '../../../core/notification';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    RouterOutlet,
    CommonModule,
    MatDialogModule,
  ],
})
export class UserPanelComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService)
  private readonly dialog = inject(MatDialog);

  user: UserRead | null = null;
  error: string | null = null;
  loading: boolean = true;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.logger.info('User not authenticated, redirecting to /login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (userRead) => {
        this.user = userRead ? { ...userRead } : null;
        this.loading = false;
        if (!this.user) {
          this.error = 'No se encontraron datos del usuario';
          this.logger.error('No user data found');
          this.router.navigate(['/login']);
          return;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del usuario';
        this.loading = false;
        this.logger.error('Failed to load user', err);
        this.router.navigate(['/login']);
      },
    });
  }

  onLogout(): void {
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result){
        this.authService.logout().pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.storageService.clearStorage();
            this.notificationService.success('Sesión cerrada correctamente', {
              duration: 4000,
              action: {
                label: 'Cerrar',
                action: () => this.notificationService.dismissAll(),
              },
            });
            this.router.navigate(['/login']);
          },
          error: (err) => {
            this.storageService.clearStorage();
            this.logger.error('Failed to logout', err);
            this.router.navigate(['/login']);
          },
        });
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}