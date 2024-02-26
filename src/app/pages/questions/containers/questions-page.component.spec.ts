import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController, NavParams } from '@ionic/angular'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { AppModule } from '../../../app.module'
import { FinishAndLaunchComponent } from '../components/finish-and-launch/finish-and-launch.component'
import { FinishComponent } from '../components/finish/finish.component'
import { IntroductionComponent } from '../components/introduction/introduction.component'
import { QuestionModule } from '../components/question/question.module'
import { ToolbarComponent } from '../components/toolbar/toolbar.component'
import { QuestionsService } from '../services/questions.service'
import { QuestionsPageComponent } from './questions-page.component'

describe('QuestionsPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule, IonicModule, PipesModule, QuestionModule],
      declarations: [
        QuestionsPageComponent,
        IntroductionComponent,
        FinishComponent,
        FinishAndLaunchComponent,
        ToolbarComponent
      ],
      providers: [
        NavController,
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

  initRemoteConfigParams() {
    return Promise.resolve({})
  }

  getIsProgressCountShown() {
    return false
  }

  getTime() {
    return 0
  }
}
