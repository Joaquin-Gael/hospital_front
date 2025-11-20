import { Routes } from '@angular/router';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminPanelComponent,
    children: [
      {
        path: '',
        redirectTo: 'departments',
        pathMatch: 'full',
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./departments/department-list.component').then((m) => m.DepartmentListComponent),
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./doctors/doctors-list.component').then((m) => m.DoctorListComponent),
      },
      {
        path: 'health-insurances',
        loadComponent: () =>
          import('./health-insurance/health-insurance-list.component').then((m) => m.HealthInsuranceListComponent),
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./locations/location-list.component').then((m) => m.LocationListComponent),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./appointments/appointments-list.component').then((m) => m.AppointmentsListComponent),
      },
      {
        path: 'schedules',
        loadComponent: () =>
          import('./schedules/schedule-list.component').then((m) => m.ScheduleListComponent),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./services/services-list.component').then((m) => m.ServiceListComponent),
      },
      {
        path: 'specialities',
        loadComponent: () =>
          import('./specialities/speciality-list.component').then((m) => m.SpecialityListComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-list.component').then((m) => m.UserListComponent),
      },
    ],
  },
];
