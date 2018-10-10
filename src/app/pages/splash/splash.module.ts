import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { SplashPageComponent } from './containers/splash-page.component'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(SplashPageComponent)
  ],
  declarations: [SplashPageComponent]
})
export class SplashModule {}
