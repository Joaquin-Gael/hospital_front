import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, combineLatest, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  isMenuOpen = false;
  scrolled = false;
  navItems: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.subscriptions.add(
      combineLatest([this.authService.loginStatus$, of(this.authService.getStoredScopes())]).subscribe(
        ([isLoggedIn, scopes]) => {
          this.navItems = this.getNavItems(isLoggedIn, scopes);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 20;
  }
}