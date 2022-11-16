import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskCalendarRowModule } from '../task-calendar-row/task-calendar-row.module'
import { TaskCalendarComponent } from './task-calendar.component'

const COMPONENTS = [TaskCalendarComponent]

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    IonicModule.forRoot(),
    PipesModule,
    TaskCalendarRowModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskCalendarModule {}
