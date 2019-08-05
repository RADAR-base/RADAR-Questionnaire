import { CommonModule } from '@angular/common'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskCalendarComponent } from './task-calendar.component'

const COMPONENTS = [TaskCalendarComponent]

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    IonicModule.forRoot(TaskCalendarComponent),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskCalendarModule {}
