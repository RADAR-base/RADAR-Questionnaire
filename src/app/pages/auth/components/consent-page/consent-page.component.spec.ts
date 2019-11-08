import { ComponentFixture, TestBed} from '@angular/core/testing'
import { NavController } from 'ionic-angular'

import { AppModule } from '../../../app.module'
import { ConsentPageComponent } from './consent-page.component'

describe('ConsentPagecomponent', () => {
  let component
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [NavController]
    }).compileComponents()

    fixture = TestBed.createComponent(ConsentPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof ConsentPageComponent).toBe(true)
  })
})
