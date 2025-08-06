import { Component, OnInit, HostListener, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-panel-ui',
  templateUrl: './panel-ui.component.html',
  styleUrls: ['./panel-ui.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  animations: [
    trigger('fadeInOut', [
      state('in', style({opacity: 1})),
      transition(':enter', [
        style({opacity: 0}),
        animate('300ms ease-in')
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({opacity: 0}))
      ])
    ]),
    trigger('slideInOut', [
      state('in', style({transform: 'translateX(0)'})),
      transition(':enter', [
        style({transform: 'translateX(-100%)'}),
        animate('300ms ease-in-out')
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({transform: 'translateX(-100%)'}))
      ])
    ])
  ]
})
export class PanelUiComponent implements OnInit {
  private readonly router = inject(Router);

  isSidebarCollapsed = false;
  isSidebarMobileOpen = false;
  isMobileView = false;
  
  private readonly MOBILE_BREAKPOINT = 768;

  menuItems: MenuItem[] = [
    { 
      label: 'Panel', 
      icon: 'dashboard', 
      route: '/medic_panel/home' 
    },
    { 
      label: 'Pacientes', 
      icon: 'people', 
      route: '/medic_panel/patients' 
    },
    {
      label: 'Agenda',
      icon: 'calendar_today',
      route: '/medic_panel/appointments',
    },
    { 
      label: 'Historiales', 
      icon: 'description', 
      route: '/medic_panel/history' 
    },
    { 
      label: 'Mensajes', 
      icon: 'chat', 
      route: '/medic_panel/messages' 
    },
    {
      label: 'Estadísticas',
      icon: 'bar_chart',
      route: '/medic_panel/statistics',
    },
    { 
      label: 'Configuración', 
      icon: 'settings', 
      route: '/medic_panel/settings' 
    },
  ];

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updateViewState();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isSidebarMobileOpen) {
      this.closeMobileSidebar();
    }
  }

  ngOnInit(): void {
    this.updateViewState();
    this.updateActiveMenuItem(this.router.url);
    
    // Cargar preferencia guardada del sidebar
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed && !this.isMobileView) {
      this.isSidebarCollapsed = savedCollapsed === 'true';
    }
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveMenuItem(event.url);
        if (this.isMobileView && this.isSidebarMobileOpen) {
          this.closeMobileSidebar();
        }
      });
  }

  private updateViewState(): void {
    const windowWidth = window.innerWidth;
    const wasMobile = this.isMobileView;
    
    this.isMobileView = windowWidth < this.MOBILE_BREAKPOINT;
    
    if (wasMobile && !this.isMobileView && this.isSidebarMobileOpen) {
      this.isSidebarMobileOpen = false;
    }
  }

  toggleSidebar(): void {
    if (!this.isMobileView) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', this.isSidebarCollapsed.toString());
    }
  }

  toggleMobileSidebar(): void {
    if (this.isMobileView) {
      this.isSidebarMobileOpen = !this.isSidebarMobileOpen;
      if (this.isSidebarMobileOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeMobileSidebar(): void {
    this.isSidebarMobileOpen = false;
    document.body.style.overflow = '';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private updateActiveMenuItem(url: string): void {
    this.menuItems.forEach(item => {
      const routeWithoutSlash = item.route.startsWith('/') ? item.route.substring(1) : item.route;
      const urlWithoutSlash = url.startsWith('/') ? url.substring(1) : url;
      
      item.active = urlWithoutSlash.includes(routeWithoutSlash) || url === item.route;
    });
  }

  onLogout(): void {
    this.closeMobileSidebar();
    localStorage.removeItem('sidebarCollapsed');
    document.body.style.overflow = '';
    
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.router.navigate(['/login']);
    }
  }
}