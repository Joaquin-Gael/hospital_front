import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/user-panel/user-panel/user-panel.component').then((m) => m.UserPanelComponent),
  },

  {
    path: "medic_panel",
    loadComponent: () => import('./pages/medic-panel/medic-panel/medic-panel.component').then((m) => m.MedicPanelComponent),
  },
];
