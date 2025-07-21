import { Injectable, type TemplateRef, inject } from "@angular/core"
import { MatSnackBar, type MatSnackBarRef } from "@angular/material/snack-bar"
import { NotificationToastComponent } from "../components/notification-toast.component"
import type {
  NotificationOptions,
  NotificationData,
  NotificationConfig,
  NotificationAction,
  NotificationType,
} from "../interfaces/notification.interface"

type CompleteNotificationOptions = {
  type: NotificationType
  duration: number
  icon: string
  panelClass: string | string[]
  horizontalPosition: "start" | "center" | "end" | "left" | "right"
  verticalPosition: "top" | "bottom"
  dismissible: boolean
  showProgress: boolean
  action?: NotificationAction
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar)

  private readonly defaultConfig: NotificationConfig = {
    success: {
      icon: "check_circle",
      duration: 4000,
      panelClass: ["notification-success"],
    },
    error: {
      icon: "error",
      duration: 6000,
      panelClass: ["notification-error"],
    },
    warning: {
      icon: "warning",
      duration: 5000,
      panelClass: ["notification-warning"],
    },
    info: {
      icon: "info",
      duration: 4000,
      panelClass: ["notification-info"],
    },
  }

  private readonly globalDefaults: Required<Omit<NotificationOptions, "action">> & { action?: NotificationAction } = {
    type: "info",
    duration: 4000,
    panelClass: [],
    horizontalPosition: "center",
    verticalPosition: "bottom",
    dismissible: true,
    icon: "",
    showProgress: true,
  }

  /**
   * Muestra una notificación personalizada
   */
  show(
    message: string,
    options: NotificationOptions = {},
  ): MatSnackBarRef<NotificationToastComponent> {
    const config = this.buildConfig(options)
    const data = this.buildNotificationData(message, config)

    return this.snackBar.openFromComponent(NotificationToastComponent, {
      data,
      duration: config.duration,
      horizontalPosition: config.horizontalPosition,
      verticalPosition: config.verticalPosition,
      panelClass: [
        "notification-container",
        ...this.defaultConfig[config.type].panelClass,
        ...(Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass]),
      ].filter(Boolean),
    })
  }

  /**
   * Muestra una notificación de éxito
   */
  success(
    message: string,
    options: Omit<NotificationOptions, "type"> = {},
  ): MatSnackBarRef<NotificationToastComponent> {
    return this.show(message, { ...options, type: "success" })
  }

  /**
   * Muestra una notificación de error
   */
  error(
    message: string,
    options: Omit<NotificationOptions, "type"> = {},
  ): MatSnackBarRef<NotificationToastComponent> {
    return this.show(message, { ...options, type: "error" })
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(
    message: string,
    options: Omit<NotificationOptions, "type"> = {},
  ): MatSnackBarRef<NotificationToastComponent> {
    return this.show(message, { ...options, type: "warning" })
  }

  /**
   * Muestra una notificación informativa
   */
  info(
    message: string,
    options: Omit<NotificationOptions, "type"> = {},
  ): MatSnackBarRef<NotificationToastComponent> {
    return this.show(message, { ...options, type: "info" })
  }

  /**
   * Cierra todas las notificaciones activas
   */
  dismissAll(): void {
    this.snackBar.dismiss()
  }

  /**
   * Construye la configuración final mezclando defaults con opciones del usuario
   */
  private buildConfig(options: NotificationOptions): CompleteNotificationOptions {
    const type = options.type || this.globalDefaults.type
    const typeDefaults = this.defaultConfig[type]

    return {
      ...this.globalDefaults,
      ...options,
      type,
      duration: options.duration ?? typeDefaults.duration,
      icon: options.icon || typeDefaults.icon,
      panelClass: options.panelClass || typeDefaults.panelClass,
    }
  }

  /**
   * Construye los datos que se pasarán al componente
   */
  private buildNotificationData(
    message: string,
    config: CompleteNotificationOptions,
  ): NotificationData {
    return {
      message: message,
      type: config.type,
      action: config.action,
      dismissible: config.dismissible,
      icon: config.icon,
      showProgress: config.showProgress,
      duration: config.duration,
    }
  }
}