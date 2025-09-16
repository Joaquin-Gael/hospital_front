import { Component, EventEmitter, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() editProfile = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveProfile = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  activeSection: string = '';

  ngOnInit(): void {
    // Establecer la sección inicial
    this.setActiveSectionFromRoute();

    // Escuchar cambios de navegación
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.setActiveSectionFromRoute();
      });
  }

  private setActiveSectionFromRoute(): void {
    const url = this.router.url.toLowerCase();
    
    if (url.includes('/appointments')) {
      this.activeSection = 'appointments';
    } else if (url.includes('/history')) {
      this.activeSection = 'history';
    } else if (url.includes('/notifications')) {
      this.activeSection = 'notifications';
    } else if (url.includes('/documents')) {
      this.activeSection = 'documents';
    } else if (url.includes('/edit-profile')) {
      this.activeSection = 'edit-profile';
    } else if (url.includes('/profile')) {
      this.activeSection = 'profile';
    } else if (url.includes('/change-password')){
      this.activeSection = 'change-password'
    } else {
      this.activeSection = 'appointments';
    }
  }

  getBreadcrumbText(section: string): string {
    const breadcrumbMap: { [key: string]: string } = {
      'appointments': 'Turnos Agendados',
      'history': 'Historial',
      'notifications': 'Notificaciones',
      'documents': 'Documentos',
      'profile': 'Perfil',
      'edit-profile': 'Editar Perfil'
    };
    
    return breadcrumbMap[section] || 'Panel de Usuario';
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  requestNewAppointment(): void {
    this.router.navigate(['/shifts']);
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onCancelEdit(): void {
    this.cancelEdit.emit();
  }

  onSaveProfile(): void {
    this.saveProfile.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}