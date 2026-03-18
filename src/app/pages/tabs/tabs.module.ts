import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { TabsComponent } from './tabs.component'
import { TasksTabComponent } from './tasks/tasks-tab.component'
import { TaskCalendarModule } from '../home/components/task-calendar/task-calendar.module'
import { PipesModule } from '../../shared/pipes/pipes.module'
import { TasksService } from '../home/services/tasks.service'

const routes: Routes = [
  {
    path: '',
    component: TabsComponent,
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('../home/home.module').then(m => m.HomeModule)
      },
      {
        path: 'tasks',
        children: [
          {
            path: '',
            component: TasksTabComponent
          }
        ]
      },
      {
        path: 'on-demand',
        loadChildren: () =>
          import('../on-demand/on-demand.module').then(m => m.OnDemandModule)
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('../settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PipesModule,
    TaskCalendarModule,
    RouterModule.forChild(routes)
  ],
  declarations: [TabsComponent, TasksTabComponent],
  providers: [TasksService]
})
export class TabsModule { }
