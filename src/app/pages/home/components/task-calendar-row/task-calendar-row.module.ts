import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { MomentModule } from 'ngx-moment'

import { TaskCalendarRowComponent } from './task-calendar-row.component'

const COMPONENTS = [TaskCalendarRowComponent]

@NgModule({
  imports: [MomentModule, CommonModule, IonicModule.forRoot()],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskCalendarRowModule {}
