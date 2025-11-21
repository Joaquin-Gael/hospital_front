import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { StorageService } from '../../../services/core/storage.service';
import { LoggerService } from '../../../services/core/logger.service';
import { NotificationService } from '../../../core/notification';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';

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
    LoadingSpinnerComponent
  ],
})
export class UserPanelComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  user: UserRead | null = null;
  error: string | null = null;
  loading: boolean = true;
  sidebarOpen: boolean = false;
  sidebarCollapsed: boolean = false;

  private readonly destroy$ = new Subject<void>();

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    const width = event.target.innerWidth;
    
    // Cerrar sidebar automáticamente en desktop
    if (width >= 1024 && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.removeSidebarOpenClass();
    }
    
    // Auto-colapsar sidebar en tablets
    if (width >= 768 && width < 1024) {
      this.sidebarCollapsed = true;
    } else if (width >= 1024) {
      this.sidebarCollapsed = false;
    }
  }

  ngOnInit(): void {
    // Detectar tamaño inicial de pantalla
    this.detectScreenSize();
    
    if (!this.authService.isLoggedIn()) {
      this.logger.info('Usuario no autenticado, redirigiendo a /login');
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
  }

  private detectScreenSize(): void {
    const width = window.innerWidth;
    
    if (width >= 768 && width < 1024) {
      this.sidebarCollapsed = true;
    }
  }

  private loadUserData(): void {
    this.loading = true;
    this.error = null;

    this.authService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userRead) => {
          this.user = userRead ? { ...userRead } : null;
          this.loading = false;
          
          if (!this.user) {
            this.error = 'No se encontraron datos del usuario';
            this.logger.error('No user data found');
            this.router.navigate(['/login']);
            return;
          }

          this.logger.info('User data loaded successfully', { userId: this.user.id });
        },
        error: (err) => {
          this.error = 'Error al cargar los datos del usuario';
          this.loading = false;
          this.logger.error('Failed to load user data', err);
          
          // Si es un error de autenticación, redirigir a login
          if (err.status === 401 || err.status === 403) {
            this.router.navigate(['/login']);
          }
        },
      });
  }

  onToggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    
    if (this.sidebarOpen) {
      this.addSidebarOpenClass();
    } else {
      this.removeSidebarOpenClass();
    }
  }

  onCloseSidebar(): void {
    this.sidebarOpen = false;
    this.removeSidebarOpenClass();
  }

  private addSidebarOpenClass(): void {
    document.body.classList.add('sidebar-open');
  }

  private removeSidebarOpenClass(): void {
    document.body.classList.remove('sidebar-open');
  }
  
    
  onEditProfile(): void {
    this.router.navigate(['/user_panel/edit-profile']);
  }

  onCancelEdit(): void {
    this.router.navigate(['/user_panel/profile']);
  }

  onSaveProfile(): void {
    // Esta funcionalidad será manejada por el componente edit-profile
    this.notificationService.success('Perfil actualizado correctamente');
    this.router.navigate(['/user_panel/profile']);
  }

  onRetry(): void {
    this.loadUserData();
  }

  onLogout(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        confirmText: 'Cerrar sesión',
        cancelText: 'Cancelar'
      },
      maxWidth: '400px',
      width: '90%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performLogout();
      }
    });
  }

  private performLogout(): void {
    // Mostrar loading durante logout
    this.loading = true;

    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.storageService.clearStorage();
          this.removeSidebarOpenClass();
          
          this.notificationService.success('Sesión cerrada correctamente', {
            duration: 3000,
            action: {
              label: 'Cerrar',
              action: () => this.notificationService.dismissAll(),
            },
          });
          
          this.router.navigate(['/login']);
        },
        error: (err) => {
          // Incluso si hay error, limpiar storage y redirigir
          this.storageService.clearStorage();
          this.removeSidebarOpenClass();
          this.logger.error('Logout error', err);
          
          this.notificationService.warning('Sesión cerrada localmente');
          this.router.navigate(['/login']);
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  // Escuchar la tecla ESC para cerrar el sidebar
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.sidebarOpen) {
      this.onCloseSidebar();
    }
  }

  // Cerrar sidebar al navegar (solo en mobile)
  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    if (window.innerWidth < 768 && this.sidebarOpen) {
      this.onCloseSidebar();
    }
  }

  ngOnDestroy(): void {
    this.removeSidebarOpenClass();
    this.destroy$.next();
    this.destroy$.complete();
  }
}