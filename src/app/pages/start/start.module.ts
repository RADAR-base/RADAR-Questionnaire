import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { StartPageComponent } from './containers/start-page.component'

@NgModule({
  imports: [CommonModule, PipesModule, IonicModule.forRoot(StartPageComponent)],
  declarations: [StartPageComponent]
})
export class StartModule {}
