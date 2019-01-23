import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskCalendarComponent } from './task-calendar.component'

const COMPONENTS = [TaskCalendarComponent]

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(TaskCalendarComponent),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskCalendarModule {}
