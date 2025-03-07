import { Routes } from '@angular/router';
import { AuthGuard } from './pages/auth/services/auth.guard'

export const routes: Routes = [
  {
    path: 'questions',
    loadComponent: () => import('./pages/questions/containers/questions-page.component').then(m => m.QuestionsPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'clinical-tasks',
    loadComponent: () => import('./pages/clinical-tasks/containers/clinical-tasks-page.component').then(m => m.ClinicalTasksPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'on-demand',
    loadComponent: () => import('./pages/on-demand/containers/on-demand-page.component').then(c => c.OnDemandPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/containers/settings-page.component').then(m => m.SettingsPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/containers/home-page.component').then(m => m.HomePageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'enrol',
    loadComponent: () => import('./pages/auth/containers/enrolment-page.component').then(m => m.EnrolmentPageComponent),
    canActivate: [],
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/splash/containers/splash-page.component').then(m => m.SplashPageComponent),
    canActivate: [],
  }
]
