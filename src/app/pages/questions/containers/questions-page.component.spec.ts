import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { NavController, NavParams } from 'ionic-angular'
import { NavParamsMock } from 'ionic-mocks'

import { AppModule } from '../../../app.module'
import { QuestionsService } from '../services/questions.service'
import { QuestionsPageComponent } from './questions-page.component'

describe('QuestionsPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        NavController,
        { provide: NavParams, useClass: NavParamsMock },
        { provide: QuestionsService, useClass: QuestionsServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(QuestionsPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof QuestionsPageComponent).toBe(true)
  })
})

export class QuestionsServiceMock {
  getQuestionnairePayload() {
    return Promise.resolve({})
  }

  getIsProgressCountShown() {
    return false
  }

  getTime() {
    return 0
  }
}
