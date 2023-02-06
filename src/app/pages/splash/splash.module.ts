import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { SplashPageComponent } from './containers/splash-page.component'
import { SplashService } from './services/splash.service'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(SplashPageComponent)
  ],
  declarations: [SplashPageComponent],
  providers: [SplashService]
})
export class SplashModule {}
