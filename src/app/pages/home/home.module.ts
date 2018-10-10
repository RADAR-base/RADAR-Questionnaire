import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { TaskCalendarModule } from './components/task-calendar/task-calendar.module'
import { TaskInfoModule } from './components/task-info/task-info.module'
import { TaskProgressModule } from './components/task-progress/task-progress.module'
import { TickerBarModule } from './components/ticker-bar/ticker-bar.module'
import { HomePageComponent } from './containers/home-page.component'

@NgModule({
  imports: [
    CommonModule,
    TaskCalendarModule,
    TaskInfoModule,
    TaskProgressModule,
    TickerBarModule,
    PipesModule,
    IonicModule.forRoot(HomePageComponent)
  ],
  declarations: [HomePageComponent]
})
export class HomeModule {}
