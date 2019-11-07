import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { NavController } from 'ionic-angular'

import { AppModule } from '../../../app.module'
import { EligibilityPageComponent } from './eligibility-page.component'

describe('EligibilityPageComponent', () => {
  let component
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [NavController]
    }).compileComponents()

    fixture = TestBed.createComponent(EligibilityPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof EligibilityPageComponent).toBe(true)
  })
})
