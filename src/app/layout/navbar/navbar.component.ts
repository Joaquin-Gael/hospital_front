import { Component, HostListener } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
  isMenuOpen = false
  scrolled = false

  navItems = [
    { label: "Inicio", route: "/" },
    { label: "Solicitar Turno", route: "/solicitar-turno" },
    { label: "Servicios", route: "/especialidades" },
    { label: "Mi Cuenta", route: "/user_panel" },
    { label: "Contacto", route: "/contact" },
  ]

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 20
  }
}

