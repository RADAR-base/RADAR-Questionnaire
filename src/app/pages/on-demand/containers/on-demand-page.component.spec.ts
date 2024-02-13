import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController } from '@ionic/angular'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { DefaultOnDemandAssessmentLabel } from '../../../../assets/data/defaultConfig'
import { AppModule } from '../../../app.module'
import { OnDemandService } from '../services/on-demand.service'
import { OnDemandPageComponent } from './on-demand-page.component'

describe('OnDemandPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule, IonicModule, PipesModule],
      declarations: [OnDemandPageComponent],
      providers: [
        NavController,
        { provide: OnDemandService, useClass: OnDemandServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(OnDemandPageComponent)
    component = fixture.debugElement.componentInstance
    component.assessments = []
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component instanceof OnDemandPageComponent).toBe(true)
  })
})

class OnDemandServiceMock {
  getAssessements() {
    return Promise.resolve([])
  }
  getOnDemandPageLabel() {
    return Promise.resolve(DefaultOnDemandAssessmentLabel)
  }
}
