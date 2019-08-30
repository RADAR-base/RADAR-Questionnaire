import { ComponentFixture, TestBed, async } from '@angular/core/testing'

import { AppModule } from '../../../app.module'
import { QuestionsPageComponent } from './questions-page.component'

describe('QuestionsPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: []
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
