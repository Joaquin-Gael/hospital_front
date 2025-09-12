import {
  Component,
  Inject,
  type OnInit,
  type OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  PLATFORM_ID
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MAT_SNACK_BAR_DATA, MatSnackBarRef, MatSnackBarModule } from "@angular/material/snack-bar"
import { isPlatformBrowser } from "@angular/common"
import type { NotificationData } from "../interfaces/notification.interface"
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser"

@Component({
  selector: "app-notification-toast",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatSnackBarModule],
  template: `
    <div 
      class="notification-toast" 
      [attr.data-type]="data.type" 
      role="alert" 
      [attr.aria-live]="ariaLive()">
      <!-- Progress bar -->
      <div 
        class="notification-progress" >
        @if (data.showProgress && data.duration > 0){
        <mat-progress-bar 
          mode="determinate" 
          [value]="progressValue()"
          [color]="progressColor()">
        </mat-progress-bar>
        }
      </div>
      <!-- Content -->
      <div class="notification-content">
        <!-- Icon -->
        <div class="notification-icon">
          <mat-icon [attr.aria-label]="iconAriaLabel()">{{ notificationIcon() }}</mat-icon>
        </div>

        <!-- Text content -->
        <div class="notification-text">
          <div class="notification-message">
            <span [innerHTML]="getSafeMessage()"></span>
          </div>
        </div>

        <!-- Dismiss button -->
        <button 
          mat-icon-button
          class="notification-dismiss-btn"
          (click)="dismiss()"
          >
          @if(data.dismissible){
            <mat-icon>close</mat-icon>
          }
        </button>
      </div>
    </div>
  `,
  styleUrl: "./notification-toast.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private readonly snackBarRef = inject(MatSnackBarRef<NotificationToastComponent>)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly sanitizer = inject(DomSanitizer)

  protected readonly progressValue = signal(100)
  private animationFrameId?: number
  private startTime = 0

  protected readonly progressColor = computed(() => {
    switch (this.data.type) {
      case "success":
        return "primary"
      case "error":
        return "warn"
      case "warning":
        return "accent"
      case "info":
        return "primary"
      default:
        return "primary"
    }
  })

  protected readonly iconAriaLabel = computed(() => {
    switch (this.data.type) {
      case "success":
        return "Éxito"
      case "error":
        return "Error"
      case "warning":
        return "Advertencia"
      case "info":
        return "Información"
      default:
        return "Notificación"
    }
  })

  // Computed para obtener el icono correcto según el tipo
  protected readonly notificationIcon = computed(() => {
    if (this.data.icon) {
      return this.data.icon; 
    }
    
    // Iconos por defecto según el tipo
    switch (this.data.type) {
      case "success":
        return "check_circle"
      case "error":
        return "error"
      case "warning":
        return "warning"
      case "info":
        return "info"
      default:
        return "notifications"
    }
  })

  protected readonly ariaLive = computed(() => {
    return ["error", "warning"].includes(this.data.type) ? "assertive" : "polite"
  })

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationData
  ) {}

  ngOnInit(): void {
    if (this.data.showProgress && this.data.duration > 0) {
      this.startProgressAnimation()
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  protected isString(value: any): value is string {
    return typeof value === "string"
  }

  protected getSafeMessage(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.data.message)
  }

  protected handleAction(): void {
    if (this.data.action) {
      this.data.action.action()
      this.dismiss()
    }
  }

  protected dismiss(): void {
    this.snackBarRef.dismiss()
  }

  private startProgressAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return

    this.startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.startTime
      const progress = Math.max(0, 100 - (elapsed / this.data.duration) * 100)
      this.progressValue.set(progress)

      if (progress > 0) {
        this.animationFrameId = requestAnimationFrame(animate)
      }
    }
    this.animationFrameId = requestAnimationFrame(animate)
  }
}