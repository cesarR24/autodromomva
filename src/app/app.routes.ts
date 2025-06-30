import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';
import { adminGuard } from './auth/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'race-results', 
    loadComponent: () => import('./race-results/race-results').then(m => m.RaceResultsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'brackets', 
    loadComponent: () => import('./bracket-view/bracket-view').then(m => m.BracketViewComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'overall-points', 
    loadComponent: () => import('./overall-points/overall-points').then(m => m.OverallPointsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'admin/race-entry', 
    loadComponent: () => import('./admin/admin-race-entry/admin-race-entry').then(m => m.AdminRaceEntryComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile-edit').then(m => m.ProfileEditComponent)
  }
];
