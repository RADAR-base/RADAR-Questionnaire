import { HttpClient, HttpHandler } from '@angular/common/http'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, async } from '@angular/core/testing'

import { PipesModule } from '../../../shared/pipes/pipes.module'
import { EnrolmentPageComponent } from './enrolment-page.component'

describe('EnrolmentPagecomponent', () => {
  let component: EnrolmentPageComponent
  let fixture: ComponentFixture<EnrolmentPageComponent>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PipesModule],
      declarations: [EnrolmentPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: []
    }).compileComponents()

    fixture = TestBed.createComponent(EnrolmentPageComponent)
    component = fixture.componentInstance
  })

  it('should create', async(() => {
    expect(component).toBeTruthy()
  }))
})
