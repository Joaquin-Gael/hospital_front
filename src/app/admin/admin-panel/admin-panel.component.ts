import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { LoggerService } from '../../services/core/logger.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { StorageService } from '../../services/core/storage.service';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';

/**
 * Contenedor principal del panel de administración.
 *
 * Responsabilidades principales:
 * - Verificar que el usuario tenga el scope `admin` antes de permitir el acceso.
 * - Mantener sincronizada la sección activa con la ruta actual para resaltar el menú correcto.
 * - Delegar el control del sidebar y del cierre de sesión a servicios compartidos.
 */
@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, AdminSidebarComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  private logger = inject(LoggerService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private readonly destroy$ = new Subject<void>();

  activeSection: string = 'departments';

  @ViewChild(AdminSidebarComponent) adminSidebar?: AdminSidebarComponent;

  ngOnInit(): void {
    if (this.authService.getStoredScopes().includes('admin')) {
      this.setActiveSectionFromRoute();

      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.setActiveSectionFromRoute();
        });
    } else {
      this.logger.warn('Acceso denegado.');
      this.router.navigate(['/home']);
    }
  }

  private setActiveSectionFromRoute(): void {
    const url = this.router.url.toLowerCase();

    // Sección activa según la URL; mantener el orden de evaluación
    // para que las coincidencias más específicas tengan prioridad.
    if (url.includes('/departments')) {
      this.activeSection = 'departments';
    } else if (url.includes('/specialities')) {
      this.activeSection = 'specialities';
    } else if (url.includes('/doctors')) {
      this.activeSection = 'doctors';
    } else if (url.includes('/schedules')) {
      this.activeSection = 'schedules';
    } else if (url.includes('/health-insurances')) {
      this.activeSection = 'health-insurances';
    } else if (url.includes('/services')) {
      this.activeSection = 'services';
    } else if (url.includes('/locations')) {
      this.activeSection = 'locations';
    } else if (url.includes('/users')) {
      this.activeSection = 'users';
    } else if (url.includes('/appointments')) {
      this.activeSection = 'appointments';
    } else if (url.includes('/cashes')) {
      this.activeSection = 'cashes';
    } else if (url.includes('/audit')) {
      this.activeSection = 'audit';
    } else {
      this.activeSection = 'departments';
    }
  }

  toggleSidebar(): void {
    this.adminSidebar?.toggleSidebar();
  }

  onSectionSelected(sectionId: string): void {
    this.activeSection = sectionId;
  }

  onLogout(): void {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.storageService.clearStorage();
          this.logger.info('Logout successful, redirecting to /login');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.storageService.clearStorage();
          this.logger.error('Failed to logout', err);
          this.router.navigate(['/login']);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}