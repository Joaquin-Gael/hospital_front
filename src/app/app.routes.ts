import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [], 
  },

  // Página sin layout
  {
    path: 'user_panel',
    loadComponent: () =>
      import('./pages/user-panel/user-panel.component').then((m) => m.UserPanelComponent),
  },

  // Redirección
  { path: '**', redirectTo: '' },
];
