import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RoundProgressModule } from 'angular-svg-round-progressbar'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskInfoComponent } from './task-info.component'

const COMPONENTS = [TaskInfoComponent]

@NgModule({
  imports: [
    RoundProgressModule,
    CommonModule,
    IonicModule.forRoot(TaskInfoComponent),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskInfoModule {}
