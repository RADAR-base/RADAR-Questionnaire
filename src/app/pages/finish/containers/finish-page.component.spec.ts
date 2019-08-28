import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { NavController, NavParams } from 'ionic-angular'
import { NavParamsMock } from 'ionic-mocks'

import { AppModule } from '../../../app.module'
import { FinishPageComponent } from './finish-page.component'

describe('FinishPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        NavController,
        { provide: NavParams, useClass: NavParamsMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(FinishPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component instanceof FinishPageComponent).toBe(true)
  })
})
