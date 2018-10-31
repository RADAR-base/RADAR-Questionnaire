import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { FinishPageComponent } from './containers/finish-page.component'
import { PrepareDataService } from './services/prepare-data.service'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(FinishPageComponent)
  ],
  declarations: [FinishPageComponent],
  providers: [PrepareDataService]
})
export class FinishModule {}
