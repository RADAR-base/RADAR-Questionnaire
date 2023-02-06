import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NavController } from 'ionic-angular'
import * as moment from 'moment'

import { DefaultTask } from '../../../../../assets/data/defaultConfig'
import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { TaskInfoComponent } from './task-info.component'
import { TaskInfoModule } from './task-info.module'

describe('TaskInfoComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TaskInfoModule, BrowserAnimationsModule],
      declarations: [],
      providers: [
        NavController,
        { provide: LocalizationService, useClass: LocalizationServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(TaskInfoComponent)
    component = fixture.debugElement.componentInstance
    component.task = DefaultTask
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof TaskInfoComponent).toBe(true)
  })
})

class LocalizationServiceMock {
  moment() {
    return moment()
  }
}
