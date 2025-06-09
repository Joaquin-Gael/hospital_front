import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { LoggerService } from '../../services/core/logger.service';
import { filter } from 'rxjs/operators';

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

  activeSection: string = 'departments';

  sections: Section[] = [
    { id: 'departments', label: 'Departamentos', icon: 'business' },
    { id: 'specialities', label: 'Especialidades', icon: 'local_hospital' },
    { id: 'doctors', label: 'Doctores', icon: 'person' },
    { id: 'schedules', label: 'Horarios', icon: 'schedule' },
    { id: 'services', label: 'Servicios', icon: 'medical_services' },
    { id: 'locations', label: 'Ubicaciones', icon: 'location_on' },
    { id: 'users', label: 'Usuarios', icon: 'people' },
  ];

  get activeSectionLabel(): string {
    return (
      this.sections.find((s) => s.id === this.activeSection)?.label || 'Panel Admin'
    );
  }

  ngOnInit(): void {
    this.logger.info('Admin Panel Component initialized');

    const url = this.router.url;
    const sectionId = url.split('/admin_panel/')[1]?.split('/')[0];
    if (sectionId && this.sections.some((s) => s.id === sectionId)) {
      this.activeSection = sectionId;
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const navUrl = event.urlAfterRedirects;
        const navSectionId = navUrl.split('/admin_panel/')[1]?.split('/')[0];
        if (navSectionId && this.sections.some((s) => s.id === navSectionId)) {
          this.activeSection = navSectionId;
        }
      });
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}