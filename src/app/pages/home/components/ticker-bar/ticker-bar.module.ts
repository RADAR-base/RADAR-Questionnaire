import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { Ng2FittextModule } from 'ng2-fittext'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TickerBarComponent } from './ticker-bar.component'

const COMPONENTS = [TickerBarComponent]

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(TickerBarComponent),
    PipesModule,
    Ng2FittextModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TickerBarModule {}
