import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { TaskCalendarModule } from './components/task-calendar/task-calendar.module'
import { TaskInfoModule } from './components/task-info/task-info.module'
import { TaskListModule } from "./components/task-list/task-list.module";
import { TaskProgressModule } from './components/task-progress/task-progress.module'
import { TickerBarModule } from './components/ticker-bar/ticker-bar.module'
import { HomePageComponent } from './containers/home-page.component'
import { TasksService } from './services/tasks.service'
import { LearningPageModule } from "./components/learning-page/learning-page.module";
import { LearningPageItemModule } from "./components/learning-page-item/learning-page-item.module";
import {AuthModule} from "../auth/auth.module";
import {StudyInfoComponent} from "./components/study-info/study-info.component";
// import {StudyInfoModule} from "../auth/components/study-info/study-info.module";

@NgModule({
  imports: [
    CommonModule,
    TaskCalendarModule,
    TaskInfoModule,
    TaskProgressModule,
    TickerBarModule,
    TaskListModule,
    PipesModule,
    LearningPageModule,
    LearningPageItemModule,
    IonicModule.forRoot(HomePageComponent),
    AuthModule,
  ],
  declarations: [HomePageComponent, StudyInfoComponent],
  providers: [TasksService]
})
export class HomeModule {}
