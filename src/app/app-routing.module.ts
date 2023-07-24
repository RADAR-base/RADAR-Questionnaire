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
    path: 'on-demand',
    loadChildren: () =>
      import('./pages/on-demand/on-demand.module').then(m => m.OnDemandModule)
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./pages/settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/home.module').then(m => m.HomeModule)
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
export class AppRoutingModule {}
