import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController } from '@ionic/angular'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { AppModule } from '../../../app.module'
import { ClinicalTasksService } from '../services/clinical-tasks.service'
import { ClinicalTasksPageComponent } from './clinical-tasks-page.component'

describe('ClinicalTasksPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule, IonicModule, PipesModule],
      declarations: [ClinicalTasksPageComponent],
      providers: [
        NavController,
        { provide: ClinicalTasksService, useClass: ClinicalTasksServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ClinicalTasksPageComponent)
    component = fixture.debugElement.componentInstance
    component.assessments = []
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component instanceof ClinicalTasksPageComponent).toBe(true)
  })
})

class ClinicalTasksServiceMock {
  getAssessements() {
    return Promise.resolve([])
  }
}
