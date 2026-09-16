import { Routes } from '@angular/router';
import { unsavedGuard } from './core/unsaved.guard';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },
  {
    path: 'projects',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
    title: 'Projects · ScopePilot',
  },
  {
    path: 'projects/new',
    loadComponent: () => import('./features/intake/intake').then((m) => m.IntakePage),
    canDeactivate: [unsavedGuard],
    title: 'New scope · ScopePilot',
  },
  {
    path: 'projects/:id/versions',
    loadComponent: () => import('./features/versions/versions').then((m) => m.VersionsPage),
    title: 'Version history · ScopePilot',
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/editor/editor').then((m) => m.EditorPage),
    canDeactivate: [unsavedGuard],
    title: 'Scope editor · ScopePilot',
  },
  { path: '**', redirectTo: 'projects' },
];
