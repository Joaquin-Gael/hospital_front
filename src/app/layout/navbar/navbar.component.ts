import { Component, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AuthService } from '../../services/auth/auth.service'; 

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
  isMenuOpen = false;
  scrolled = false;
  isLoggedIn = false;

  constructor(private authService: AuthService) {
    this.isLoggedIn = this.authService.isLoggedIn(); 
  }

  navItems = this.getNavItems();

  getNavItems() {
    const baseItems = [
      { label: "Inicio", route: "/" },
      { label: "Contacto", route: "/contact" },
    ];

    if (this.isLoggedIn) {
      return [...baseItems, { label: "Mi Cuenta", route: "/user_panel" }, { label: "Solicitar Turno", route: "/shifts" }];
    } else {
      return [...baseItems, { label: "Iniciar Sesión", route: "/login" }, { label: "Registrarse", route: "/register" }];
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 20;
  }
}