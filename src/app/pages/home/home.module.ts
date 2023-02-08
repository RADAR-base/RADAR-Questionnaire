import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { TaskCalendarModule } from './components/task-calendar/task-calendar.module'
import { TaskInfoModule } from './components/task-info/task-info.module'
import { TaskProgressModule } from './components/task-progress/task-progress.module'
import { TickerBarModule } from './components/ticker-bar/ticker-bar.module'
import { HomePageComponent } from './containers/home-page.component'
import { TasksService } from './services/tasks.service'

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  }
]

@NgModule({
  imports: [
    CommonModule,
    TaskCalendarModule,
    TaskInfoModule,
    TaskProgressModule,
    TickerBarModule,
    PipesModule,
    IonicModule.forRoot(),
    RouterModule.forChild(routes)
  ],
  declarations: [HomePageComponent],
  providers: [TasksService]
})
export class HomeModule {}
