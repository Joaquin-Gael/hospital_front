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
  isLoggedIn: boolean = false;
  scopes: string[] = []

  @ViewChild('userButton') userButtonRef!: ElementRef;
  @ViewChild('dropdownMenu') dropdownRef!: ElementRef;

  readonly sections: ReadonlyArray<Section> = [
    { id: 'departments', label: 'Departamentos', icon: 'business' },
    { id: 'specialities', label: 'Especialidades', icon: 'local_hospital' },
    { id: 'doctors', label: 'Doctores', icon: 'person' },
    { id: 'schedules', label: 'Horarios', icon: 'schedule' },
    { id: 'health-insurances', label: 'Seguros de Salud', icon: 'health_and_safety' },
    { id: 'services', label: 'Servicios', icon: 'medical_services' },
    { id: 'locations', label: 'Ubicaciones', icon: 'location_on' },
    { id: 'users', label: 'Usuarios', icon: 'people' },
  ];

  get activeSectionLabel(): string {
    return this.sections.find((s) => s.id === this.activeSection)?.label || 'Panel Admin';
  }

  ngOnInit(): void {
    if(this.authService.getStoredScopes().includes('admin')){
      const url = this.router.url;
      const sectionId = url.split('/admin_panel/')[1]?.split('/')[0];
      if (sectionId && this.sections.some((s) => s.id === sectionId)) {
        this.activeSection = sectionId;
      }

      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe((event) => {
          const navEvent = event as NavigationEnd;
          const navUrl = navEvent.urlAfterRedirects;
          const navSectionId = navUrl.split('/admin_panel/')[1]?.split('/')[0];
          if (navSectionId && this.sections.some((s) => s.id === navSectionId)) {
            this.activeSection = navSectionId;
          }
        });
    } else {
      this.logger.warn('Acceso denegado.')
      this.router.navigate(['/home'])
    }
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

  setActiveSection(section: string): void {
    this.activeSection = section;
    this.router.navigate(['/admin_panel', section]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe()
  }
}