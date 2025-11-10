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
import { RouterModule } from "@angular/router"
import { Subscription, combineLatest, of } from "rxjs"
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

  // inyección vía inject()
  private readonly authService = inject(AuthService)

  // nav items derivados del estado
  navItems = computed(() =>
    this.getNavItems(this.isLoggedIn(), this.userScopes()),
  )

  // efecto de debug (opcional)
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
    // si te preocupa SSR, podés envolver en un if (typeof window === "undefined") return;
    const scrollPosition = window.scrollY || document.documentElement.scrollTop
    this.scrollState.set(scrollPosition > 50 ? "scrolled" : "initial")
  }
}
