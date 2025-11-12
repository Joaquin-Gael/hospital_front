import {
  Component,
  type OnInit,
  type OnDestroy,
  HostListener,
  signal,
  computed,
  effect,
  inject,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router, RouterModule, NavigationEnd } from "@angular/router"
import { Subscription, combineLatest, of, filter } from "rxjs"
import { AuthService } from "../../services/auth/auth.service"

interface NavItem {
  label: string
  route: string
}

type ScrollState = "initial" | "scrolled"

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription()
  
  // signals de estado
  menuOpen = signal(false)
  scrollState = signal<ScrollState>("initial")
  isLoggedIn = signal(false)
  userScopes = signal<string[]>([])
  
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)
  
  navItems = computed(() =>
    this.getNavItems(this.isLoggedIn(), this.userScopes()),
  )
  
  // efecto de debug
  private readonly logEffect = effect(() => {
    console.log("[v0] Navbar state:", {
      scrollState: this.scrollState(),
      menuOpen: this.menuOpen(),
      isLoggedIn: this.isLoggedIn(),
    })
  })
  
  ngOnInit(): void {
    // sincronizar login + scopes
    this.subscriptions.add(
      combineLatest([
        this.authService.loginStatus$,
        of(this.authService.getStoredScopes()),
      ]).subscribe(([isLoggedIn, scopes]) => {
        this.isLoggedIn.set(isLoggedIn)
        this.userScopes.set(scopes)
      }),
    )
    
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    )
    
    // estado inicial de scroll
    this.onWindowScroll()
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }
  
  private getNavItems(isLoggedIn: boolean, scopes: string[]): NavItem[] {
    const baseItems: NavItem[] = [
      { label: "Inicio", route: "/" },
      { label: "Contacto", route: "/contact" },
    ]
    
    if (isLoggedIn) {
      let accountRoute = "/user_panel"
      if (scopes.includes("doc")) {
        accountRoute = "/medic_panel"
      } else if (scopes.includes("admin")) {
        accountRoute = "/admin_panel"
      } else if (
        scopes.includes("user") ||
        scopes.includes("superuser") ||
        scopes.includes("google")
      ) {
        accountRoute = "/user_panel"
      }
      
      return [
        ...baseItems,
        { label: "Mi Cuenta", route: accountRoute },
        { label: "Solicitar Turno", route: "/shifts" },
      ]
    }
    
    return [
      ...baseItems,
      { label: "Iniciar Sesión", route: "/login" },
      { label: "Registrarse", route: "/register" },
    ]
  }
  
  toggleMenu(): void {
    this.menuOpen.update((value) => !value)
  }
  
  closeMenu(): void {
    this.menuOpen.set(false)
  }
  
  @HostListener("window:scroll")
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop
    this.scrollState.set(scrollPosition > 50 ? "scrolled" : "initial")
  }
}