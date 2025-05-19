import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Doctor } from "../../../services/interfaces/doctor.interfaces"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms"

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
}

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class SettingsComponent implements OnInit {
  doctor: Doctor | null = null;
  activeTab = "profile"
  profileForm!: FormGroup
  securityForm!: FormGroup
  notificationSettings: NotificationSetting[] = []

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms()
    this.loadNotificationSettings()
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      firstName: [this.doctor?.first_name, [Validators.required]],
      lastName: [this.doctor?.last_name, [Validators.required]],
      email: [this.doctor?.email, [Validators.required, Validators.email]],
      phone: [this.doctor?.telephone, [Validators.required]],
      specialization: ["Medicina General", [Validators.required]],
      licenseNumber: ["MED-12345", [Validators.required]],
      address: [this.doctor?.address, [Validators.required]],
      bio: ["Médico general con más de 10 años de experiencia en atención primaria y urgencias."],
    })

    this.securityForm = this.fb.group(
      {
        currentPassword: ["", [Validators.required]],
        newPassword: ["", [Validators.required, Validators.minLength(8)]],
        confirmPassword: ["", [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      },
    )
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get("newPassword")?.value
    const confirmPassword = form.get("confirmPassword")?.value

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true }
    }

    return null
  }

  loadNotificationSettings(): void {
    this.notificationSettings = [
      {
        id: "new_appointment",
        label: "Nuevas citas",
        description: "Recibir notificaciones cuando se programe una nueva cita",
        enabled: true,
      },
      {
        id: "appointment_reminder",
        label: "Recordatorios de citas",
        description: "Recibir recordatorios 24 horas antes de las citas",
        enabled: true,
      },
      {
        id: "appointment_changes",
        label: "Cambios en citas",
        description: "Recibir notificaciones cuando una cita sea modificada o cancelada",
        enabled: true,
      },
      {
        id: "new_messages",
        label: "Nuevos mensajes",
        description: "Recibir notificaciones cuando lleguen nuevos mensajes",
        enabled: true,
      },
      {
        id: "system_updates",
        label: "Actualizaciones del sistema",
        description: "Recibir notificaciones sobre actualizaciones y mantenimiento",
        enabled: false,
      },
      {
        id: "marketing",
        label: "Comunicaciones de marketing",
        description: "Recibir información sobre nuevas características y ofertas",
        enabled: false,
      },
    ]
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab
  }

  saveProfileSettings(): void {
    if (this.profileForm.valid) {
      console.log("Guardando configuración de perfil:", this.profileForm.value)
      // Aquí iría la lógica para guardar en el backend
      alert("Configuración de perfil guardada correctamente")
    } else {
      this.profileForm.markAllAsTouched()
    }
  }

  saveSecuritySettings(): void {
    if (this.securityForm.valid) {
      console.log("Guardando configuración de seguridad")
      alert("Contraseña actualizada correctamente")
      this.securityForm.reset()
    } else {
      this.securityForm.markAllAsTouched()
    }
  }

  toggleNotification(setting: NotificationSetting): void {
    setting.enabled = !setting.enabled
    console.log(`Notificación ${setting.id} ${setting.enabled ? "activada" : "desactivada"}`)
  }

  saveNotificationSettings(): void {
    console.log("Guardando configuración de notificaciones:", this.notificationSettings)
    alert("Configuración de notificaciones guardada correctamente")
  }
}