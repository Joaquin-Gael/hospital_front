import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserRead } from '../../../services/interfaces/user.interfaces';
import { Subject, takeUntil, fromEvent } from 'rxjs';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() user: UserRead | null = null;
  @Input() isOpen: boolean = false;
  @Input() isCollapsed: boolean = false;
  @Output() logout = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    { 
      label: 'Turnos Agendados', 
      route: '/user_panel/appointments', 
      icon: 'calendar',
      badge: undefined 
    },
    { 
      label: 'Historial', 
      route: '/user_panel/history', 
      icon: 'history' 
    },
    { 
      label: 'Notificaciones', 
      route: '/user_panel/notifications', 
      icon: 'bell',
      badge: undefined 
    },
    { 
      label: 'Documentos', 
      route: '/user_panel/documents', 
      icon: 'file' 
    },
    { 
      label: 'Perfil', 
      route: '/user_panel/profile', 
      icon: 'user' 
    },
  ];

  ngOnInit(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.key === 'Escape' && this.isOpen) {
          this.onClose();
        }
      });

    this.handleBodyScroll();
  }

  private handleBodyScroll(): void {
    const body = document.body;
    
    if (this.isOpen) {
      body.classList.add('sidebar-open');
    } else {
      body.classList.remove('sidebar-open');
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('sidebar-open');
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fullName(): string {
    if (!this.user) return 'No disponible';
    return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || this.user.username || 'No disponible';
  }

  getInitials(name: string): string {
    if (!name || name === 'No disponible') return 'ND';
    
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'ND';
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  onNavItemClick(item: MenuItem): void {
    if (window.innerWidth < 768) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  onImageError(): void {
    if (this.user) {
      this.user.img_profile = null;
    }
  }

  updateNotificationBadge(count: number): void {
    const notificationItem = this.menuItems.find(item => item.icon === 'bell');
    if (notificationItem) {
      notificationItem.badge = count > 0 ? count : undefined;
    }
  }

  updateAppointmentBadge(count: number): void {
    const appointmentItem = this.menuItems.find(item => item.icon === 'calendar');
    if (appointmentItem) {
      appointmentItem.badge = count > 0 ? count : undefined;
    }
  }
}