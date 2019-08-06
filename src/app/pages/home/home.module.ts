import { CommonModule } from '@angular/common'
import { HomePageComponent } from './containers/home-page.component'
import { IonicModule } from 'ionic-angular'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../shared/pipes/pipes.module'
import { TaskCalendarModule } from './components/task-calendar/task-calendar.module'
import { TaskInfoModule } from './components/task-info/task-info.module'
import { TaskProgressModule } from './components/task-progress/task-progress.module'
import { TasksService } from './services/tasks.service'
import { TickerBarModule } from './components/ticker-bar/ticker-bar.module'

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
  declarations: [HomePageComponent],
  providers: [TasksService]
})
export class HomeModule {}
