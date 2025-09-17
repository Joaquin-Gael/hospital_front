import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';
import { MedicPanelComponent } from './pages/medic-panel/medic-panel/medic-panel.component';
import { UserPanelComponent } from './pages/user-panel/user-panel/user-panel.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then(
            (m) => m.ContactComponent
          ),
      },
      {
        canActivate: [authGuard],
        path: 'shifts',
        loadComponent: () =>
          import('./pages/shifts/shift/shift.component').then(
            (m) => m.ShiftsComponent
          ),
      },
      {
        path: 'authorities',
        loadComponent: () =>
          import('./pages/authorities/authorities.component').then(
            (m) => m.AuthoritiesComponent
          ),
      },
      {
        path: 'about-appointments',
        loadComponent: () =>
          import(
            './pages/about-appointments/about-appointments.component'
          ).then((m) => m.AboutAppointmentsComponent),
      },
      {
        path: 'doctor-login',
        loadComponent: () =>
          import('./auth/doctor-login/doctor-login.component').then(
            (m) => m.DoctorLoginComponent
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login/login.component').then((m) => m.LoginComponent),
      },
    ],
  },

  {
    path: 'admin_panel',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  {
    path: 'user_panel',
    component: UserPanelComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/user-panel/appointments/appointments.component').then(
            (m) => m.AppointmentsComponent
          ),
      },
      {
        path: 'reschedule-appointment/:id',
        loadComponent: () =>
          import(
            './pages/user-panel/update-appointment/update-appointment.component'
          ).then((m) => m.UpdateAppointmentComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/user-panel/history/history.component').then(
            (m) => m.HistoryComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './pages/user-panel/notifications/notifications.component'
          ).then((m) => m.NotificationsComponent),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./pages/user-panel/documents/documents.component').then(
            (m) => m.DocumentsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/user-panel/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./pages/user-panel/change-password-form/change-password-form.component').then(
            (m) => m.ChangePasswordFormComponent
          )
      },
      {
        path: 'edit-profile',
        loadComponent: () =>
          import('./pages/user-panel/edit-profile/edit-profile.component').then(
            (m) => m.EditProfileComponent
          ),
      },
      {
        path: '',
        redirectTo: 'appointments',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: 'medic_panel',
    component: MedicPanelComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import(
            './pages/medic-panel/doctor-profile/doctor-profile.component'
          ).then((m) => m.DoctorProfileComponent),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/medic-panel/patients/patients.component').then(
            (m) => m.PatientsComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import(
            './pages/medic-panel/appointment-schedule/appointment-schedule.component'
          ).then((m) => m.AppointmentScheduleComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import(
            './pages/medic-panel/medical-history/medical-history.component'
          ).then((m) => m.MedicalHistoryComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/medic-panel/messages/messages.component').then(
            (m) => m.MessagesComponent
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./pages/medic-panel/statistics/statistics.component').then(
            (m) => m.StatisticsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/medic-panel/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
