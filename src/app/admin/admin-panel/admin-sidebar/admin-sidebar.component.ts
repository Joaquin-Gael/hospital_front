import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoggerService } from '../../../services/core/logger.service';

interface Section {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent {
  private readonly logger = inject(LoggerService);

  @Input() activeSection: string = 'departments';
  @Output() sectionSelected = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  sidebarOpen: boolean = false;

  readonly sections: ReadonlyArray<Section> = [
    { id: 'departments', label: 'Departamentos', icon: 'business' },
    { id: 'specialities', label: 'Especialidades', icon: 'local_hospital' },
    { id: 'doctors', label: 'Doctores', icon: 'person' },
    { id: 'appointments', label: 'Turnos', icon: 'event' },
    { id: 'schedules', label: 'Horarios', icon: 'schedule' },
    { id: 'health-insurances', label: 'Obras Sociales', icon: 'health_and_safety' },
    { id: 'services', label: 'Servicios', icon: 'medical_services' },
    { id: 'locations', label: 'Ubicaciones', icon: 'location_on' },
    { id: 'users', label: 'Usuarios', icon: 'people' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.logger.debug(`Sidebar toggled: ${this.sidebarOpen}`);
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.logger.debug('Sidebar closed');
  }

  onNavItemClick(section: Section): void {
    this.sectionSelected.emit(section.id);

    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }

    this.logger.debug(`Navigation clicked: ${section.label}`);
  }

  onLogout(): void {
    this.logout.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
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
}
