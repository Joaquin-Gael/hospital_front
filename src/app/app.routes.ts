import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then((m) => m.ContactComponent),
      }
      ],
  },

  {
    path: 'user_panel',
    loadComponent: () =>
      import('./pages/user-panel/user-panel.component').then((m) => m.UserPanelComponent),
  },

  { path: '**', redirectTo: '' },
];
