import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: 'questions',
    loadChildren: () =>
      import('./pages/questions/questions.module').then(m => m.QuestionsModule)
  },
  {
    path: 'clinical-tasks',
    loadChildren: () =>
      import('./pages/clinical-tasks/clinical-tasks.module').then(
        m => m.ClinicalTasksModule
      )
  },
  {
    path: 'healthkit',
    loadChildren: () =>
      import('./pages/tasks/healthkit/healthkit.module').then(m => m.HealthkitModule)
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/tabs/tabs.module').then(m => m.TabsModule)
  },
  {
    path: 'home',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'settings',
    redirectTo: 'tabs/settings',
    pathMatch: 'full'
  },
  {
    path: 'on-demand',
    redirectTo: 'tabs/on-demand',
    pathMatch: 'full'
  },
  {
    path: 'enrol',
    loadChildren: () =>
      import('./pages/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./pages/splash/splash.module').then(m => m.SplashModule)
  }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
