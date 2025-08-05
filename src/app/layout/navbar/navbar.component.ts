import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private loginStatusSubscription!: Subscription
  isMenuOpen = false;
  scrolled = false;
  navItems: any[] = [];

  constructor(
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loginStatusSubscription = this.authService.loginStatus$.subscribe((isLoggedIn) => {
      this.navItems = this.getNavItems(isLoggedIn);
    });
  }

  ngOnDestroy() {
    if (this.loginStatusSubscription) {
      this.loginStatusSubscription.unsubscribe();
    }
  }

  getNavItems(isLoggedIn: boolean): any[] {
    const baseItems = [
      { label: 'Inicio', route: '/' },
      { label: 'Contacto', route: '/contact' },
    ];

    if (isLoggedIn) {
      return [...baseItems, { label: 'Mi Cuenta', route: '/user_panel' }, { label: 'Solicitar Turno', route: '/shifts' }];
    } else {
      return [...baseItems, { label: 'Iniciar Sesión', route: '/login' }, { label: 'Registrarse', route: '/register' }];
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