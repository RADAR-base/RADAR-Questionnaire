import { CommonModule } from '@angular/common'
import { FinishPageComponent } from './containers/finish-page.component'
import { FinishTaskService } from './services/finish-task.service'
import { IonicModule } from 'ionic-angular'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../shared/pipes/pipes.module'
import { PrepareDataService } from './services/prepare-data.service'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(FinishPageComponent)
  ],
  declarations: [FinishPageComponent],
  providers: [PrepareDataService, FinishTaskService]
})
export class FinishModule {}
