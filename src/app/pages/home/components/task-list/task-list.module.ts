import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskListComponent } from "./task-list.component";

const COMPONENTS = [TaskListComponent]

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(TaskListComponent),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class TaskListModule {}
