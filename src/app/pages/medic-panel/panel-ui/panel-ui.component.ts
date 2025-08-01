import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

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
})
export class PanelUiComponent implements OnInit {
  private readonly router = inject(Router);

  isSidebarCollapsed = false;
  isSidebarMobileOpen = false;
  screenWidth = window.innerWidth;

  menuItems: MenuItem[] = [
    { label: 'Panel', icon: 'dashboard', route: 'medic_panel/home' },
    { label: 'Pacientes', icon: 'people', route: 'medic_panel/patients' },
    {
      label: 'Agenda',
      icon: 'calendar_today',
      route: 'medic_panel/appointments',
    },
    { label: 'Historiales', icon: 'description', route: 'medic_panel/history' },
    { label: 'Mensajes', icon: 'chat', route: 'medic_panel/messages' },
    {
      label: 'Estadísticas',
      icon: 'bar_chart',
      route: 'medic_panel/statistics',
    },
    { label: 'Configuración', icon: 'settings', route: 'medic_panel/settings' },
  ];

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
    if (this.screenWidth >= 992 && this.isSidebarMobileOpen) {
      this.isSidebarMobileOpen = false;
    }
  }

  ngOnInit(): void {
    this.updateActiveMenuItem(this.router.url);
    this.router.events.subscribe(() => {
      this.updateActiveMenuItem(this.router.url);
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.isSidebarMobileOpen = !this.isSidebarMobileOpen;
  }

  closeMobileSidebar(): void {
    this.isSidebarMobileOpen = false;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.screenWidth < 992) {
      this.isSidebarMobileOpen = false;
    }
  }

  private updateActiveMenuItem(url: string): void {
    this.menuItems.forEach((item) => {
      item.active = url.includes(item.route);
    });
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }
}
