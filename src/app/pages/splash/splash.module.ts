import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { SplashPageComponent } from './containers/splash-page.component'
import { SplashService } from './services/splash.service'

const routes: Routes = [
  {
    path: '',
    component: SplashPageComponent,
    canActivate: [AuthGuard]
  }
]

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(),
    RouterModule.forChild(routes)
  ],
  declarations: [SplashPageComponent],
  providers: [SplashService]
})
export class SplashModule {}
