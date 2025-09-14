import { Component, OnInit, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { LoggerService } from '../../services/core/logger.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { StorageService } from '../../services/core/storage.service';

interface Section {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  private logger = inject(LoggerService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private readonly destroy$ = new Subject<void>();
  private subscriptions: Subscription = new Subscription();

  activeSection: string = 'departments';            
  isUserMenuOpen: boolean = false;
  sidebarOpen: boolean = false;

  @ViewChild('userButton') userButtonRef!: ElementRef;
  @ViewChild('dropdownMenu') dropdownRef!: ElementRef;

  readonly sections: ReadonlyArray<Section> = [
    { id: 'departments', label: 'Departamentos', icon: 'business' },
    { id: 'specialities', label: 'Especialidades', icon: 'local_hospital' },
    { id: 'doctors', label: 'Doctores', icon: 'person' },
    { id: 'schedules', label: 'Horarios', icon: 'schedule' },
    { id: 'health-insurances', label: 'Obras Sociales', icon: 'health_and_safety' },
    { id: 'services', label: 'Servicios', icon: 'medical_services' },
    { id: 'locations', label: 'Ubicaciones', icon: 'location_on' },
    { id: 'users', label: 'Usuarios', icon: 'people' },
  ];

  ngOnInit(): void {
    if(this.authService.getStoredScopes().includes('admin')){
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
      this.logger.warn('Acceso denegado.')
      this.router.navigate(['/home'])
    }
  }

  private setActiveSectionFromRoute(): void {
    const url = this.router.url.toLowerCase();
    
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
    } else {
      this.activeSection = 'departments';
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.logger.debug(`Sidebar toggled: ${this.sidebarOpen}`);
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.logger.debug('Sidebar closed');
  }

  onNavItemClick(section: Section): void {
    this.activeSection = section.id;
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }
    this.logger.debug(`Navigation clicked: ${section.label}`);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.logger.debug(`User menu toggled: ${this.isUserMenuOpen}`);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      this.isUserMenuOpen &&
      !this.userButtonRef?.nativeElement.contains(target) &&
      !this.dropdownRef?.nativeElement.contains(target)
    ) {
      this.isUserMenuOpen = false;
      this.logger.debug('User menu closed due to outside click');
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    if (this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
      this.logger.debug('User menu closed with Escape key');
    }
    if (this.sidebarOpen) {
      this.closeSidebar();
      this.logger.debug('Sidebar closed with Escape key');
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    if (window.innerWidth >= 1024 && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.logger.debug('Sidebar closed due to desktop resize');
    }
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
    this.subscriptions.unsubscribe()
  }
}