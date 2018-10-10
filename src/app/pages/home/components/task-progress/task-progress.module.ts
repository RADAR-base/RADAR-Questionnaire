import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RoundProgressModule } from 'angular-svg-round-progressbar'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskProgressComponent } from './task-progress.component'

const COMPONENTS = [TaskProgressComponent]

@NgModule({
  imports: [
    RoundProgressModule,
    CommonModule,
    IonicModule.forRoot(TaskProgressComponent),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskProgressModule {}
