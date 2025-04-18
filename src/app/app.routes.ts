import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';
import { MedicPanelComponent } from './pages/medic-panel/medic-panel.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then((m) => m.ContactComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login/login.component').then((m) => m.LoginComponent),
      }
      ],
  },

  {
    path: 'user_panel',
    loadComponent: () =>
      import('./pages/user-panel/user-panel.component').then((m) => m.UserPanelComponent),
  },

  {
    path: "medic_panel",
    loadComponent: () => import('./pages/medic-panel/medic-panel.component').then((m) => m.MedicPanelComponent),
  },

  { path: '**', redirectTo: '' },
];
