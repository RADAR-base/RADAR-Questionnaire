import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { NavController } from 'ionic-angular'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { LogService } from '../../../../core/services/misc/log.service'
import { TaskCalendarComponent } from './task-calendar.component'
import { TaskCalendarModule } from './task-calendar.module'

describe('TaskCalendarComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TaskCalendarModule],
      declarations: [],
      providers: [
        NavController,
        { provide: LocalizationService, useClass: LocalizationServiceMock },
        { provide: LogService, useClass: LogServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(TaskCalendarComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof TaskCalendarComponent).toBe(true)
  })
})

class LocalizationServiceMock {}

class LogServiceMock {}
