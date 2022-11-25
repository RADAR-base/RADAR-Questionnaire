import { EventEmitter } from '@angular/core'
import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController } from '@ionic/angular'
import { Task, TasksProgress } from 'src/app/shared/models/task'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { AppModule } from '../../../app.module'
import { TaskCalendarModule } from '../components/task-calendar/task-calendar.module'
import { TaskInfoModule } from '../components/task-info/task-info.module'
import { TaskProgressModule } from '../components/task-progress/task-progress.module'
import { TickerBarModule } from '../components/ticker-bar/ticker-bar.module'
import { TasksService } from '../services/tasks.service'
import { HomePageComponent } from './home-page.component'

describe('HomePageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        IonicModule,
        TaskProgressModule,
        TickerBarModule,
        TaskInfoModule,
        TaskCalendarModule,
        PipesModule
      ],
      declarations: [HomePageComponent],
      providers: [
        NavController,
        { provide: TasksService, useClass: TasksServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(HomePageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof HomePageComponent).toBe(true)
  })
})

export class TasksServiceMock {
  changeDetectionEmitter: EventEmitter<void> = new EventEmitter<void>()

  getTasksOfToday() {
    return Promise.resolve([])
  }

  getValidTasksMap(): Promise<Map<number, Task[]>> {
    return Promise.resolve(new Map())
  }

  getTaskProgress(): Promise<TasksProgress> {
    return Promise.resolve({
      numberOfTasks: 5,
      completedTasks: 1
    })
  }

  getHasOnDemandTasks() {
    return Promise.resolve(false)
  }

  getHasClinicalTasks() {
    return Promise.resolve(false)
  }

  getPlatformInstanceName() {
    return Promise.resolve('RADAR')
  }

  getIsTaskCalendarTaskNameShown() {
    return Promise.resolve(false)
  }

  getOnDemandAssessmentIcon() {
    return Promise.resolve('')
  }
}
