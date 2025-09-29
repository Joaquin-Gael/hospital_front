import { Component, OnInit, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  scrolled = false;

  navItems = computed(() => {
    const isLoggedIn = this.authService.loginStatus$(); 
    const scopes = this.authService.scopes$();       
    return this.getNavItems(isLoggedIn, scopes);
  });

  constructor(private authService: AuthService) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.getScopes().subscribe({
        next: (scopes) => {
          this.authService.setScopes(scopes);
        },
        error: () => this.authService.setLoggedIn(false)
      });
    }
  }

  getNavItems(isLoggedIn: boolean, scopes: string[]): any[] {
    const baseItems = [
      { label: 'Inicio', route: '/' },
      { label: 'Contacto', route: '/contact' },
    ];
    if (isLoggedIn) {
      let accountRoute = '/user_panel';
      if (scopes.includes('doc')) {
        accountRoute = '/medic_panel';
      } else if (scopes.includes('admin')) {
        accountRoute = '/admin_panel';
      } else if (scopes.includes('user') || scopes.includes('superuser') || scopes.includes('google')) {
        accountRoute = '/user_panel';
      }
      return [
        ...baseItems,
        { label: 'Mi Cuenta', route: accountRoute },
        { label: 'Solicitar Turno', route: '/shifts' },
      ];
    } else {
      return [
        ...baseItems,
        { label: 'Iniciar Sesión', route: '/login' },
        { label: 'Registrarse', route: '/register' },
      ];
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  trackByLabel(index: number, item: any) {
    return item.label;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 20;
  }
}
