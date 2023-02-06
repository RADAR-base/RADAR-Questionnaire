import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { OnDemandPageComponent } from './containers/on-demand-page.component'
import { OnDemandService } from './services/on-demand.service'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(OnDemandPageComponent)
  ],
  declarations: [OnDemandPageComponent],
  providers: [OnDemandService]
})
export class OnDemandModule {}
