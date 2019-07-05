import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'

import { CommonModule } from '@angular/common'
import { IonicModule } from 'ionic-angular'
import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { RoundProgressModule } from 'angular-svg-round-progressbar'
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
  exports: COMPONENTS,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskProgressModule {}
