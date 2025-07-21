export type NotificationType = "success" | "error" | "warning" | "info"

export interface NotificationAction {
  label: string
  action: () => void
}

export interface NotificationOptions {
  type?: NotificationType
  duration?: number
  action?: NotificationAction
  panelClass?: string | string[]
  horizontalPosition?: "start" | "center" | "end" | "left" | "right"
  verticalPosition?: "top" | "bottom"
  dismissible?: boolean
  icon?: string
  showProgress?: boolean
}

export interface NotificationData {
  message: string
  type: NotificationType
  action?: NotificationAction
  dismissible: boolean
  icon?: string
  showProgress: boolean
  duration: number
}

export interface NotificationConfig {
  success: {
    icon: string
    duration: number
    panelClass: string[]
  }
  error: {
    icon: string
    duration: number
    panelClass: string[]
  }
  warning: {
    icon: string
    duration: number
    panelClass: string[]
  }
  info: {
    icon: string
    duration: number
    panelClass: string[]
  }
}
