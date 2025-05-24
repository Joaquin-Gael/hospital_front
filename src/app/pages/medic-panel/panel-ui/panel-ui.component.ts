import { Component, type OnInit, Output, EventEmitter, HostListener } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"

interface MenuItem {
  label: string
  icon: string
  id: string
  active?: boolean
}

@Component({
  selector: "app-panel-ui",
  templateUrl: "./panel-ui.component.html",
  styleUrls: ["./panel-ui.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class PanelUiComponent implements OnInit {
  @Output() sectionChange = new EventEmitter<string>()
  @Output() logout = new EventEmitter<void>();

  isSidebarCollapsed = false
  isSidebarMobileOpen = false
  activeSection = "panel"
  screenWidth = window.innerWidth

  menuItems: MenuItem[] = [
    { label: "Panel", icon: "icon-dashboard", id: "panel" },
    { label: "Pacientes", icon: "icon-users", id: "patients" },
    { label: "Agenda", icon: "icon-calendar", id: "schedule" },
    { label: "Historiales", icon: "icon-file-text", id: "records" },
    { label: "Mensajes", icon: "icon-message-circle", id: "messages" },
    { label: "Estadísticas", icon: "icon-bar-chart", id: "statistics" },
    { label: "Configuración", icon: "icon-settings", id: "settings" },
  ]

  constructor() {}

  @HostListener("window:resize", ["$event"])
  onResize(event: any) {
    this.screenWidth = window.innerWidth

    // Auto-close mobile sidebar on larger screens
    if (this.screenWidth >= 992 && this.isSidebarMobileOpen) {
      this.isSidebarMobileOpen = false
    }
  }

  ngOnInit(): void {
    // Set initial active section
    this.setActiveSection("panel")
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed
  }

  toggleMobileSidebar(): void {
    this.isSidebarMobileOpen = !this.isSidebarMobileOpen
  }

  closeMobileSidebar(): void {
    this.isSidebarMobileOpen = false
  }

  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId
    this.menuItems.forEach((item) => {
      item.active = item.id === sectionId
    })
    this.sectionChange.emit(sectionId)

    // Close mobile sidebar when selecting a section
    if (this.screenWidth < 992) {
      this.isSidebarMobileOpen = false
    }
  }

  onLogout(): void {
    this.logout.emit()
  }
}
