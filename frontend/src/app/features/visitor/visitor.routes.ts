import { Routes } from '@angular/router';

export const visitorRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./visitor-layout.component').then((m) => m.VisitorLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/visitor-dashboard.component').then(
            (m) => m.VisitorDashboardComponent
          ),
      },
      {
        path: 'requests/new',
        loadComponent: () =>
          import('./request-form/visit-request-form.component').then(
            (m) => m.VisitRequestFormComponent
          ),
      },
      {
        path: 'requests/:id/edit',
        loadComponent: () =>
          import('./request-form/visit-request-form.component').then(
            (m) => m.VisitRequestFormComponent
          ),
      },
    ],
  },
];
