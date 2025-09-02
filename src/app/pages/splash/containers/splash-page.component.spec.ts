import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController, NavParams } from '@ionic/angular'

import { AppModule } from '../../../app.module'
import { SplashPageComponent } from './splash-page.component'
import { KafkaService } from 'src/app/core/services/kafka/kafka.service'
import { KafkaServiceMock } from 'src/app/shared/testing/mock-services'

describe('SpashPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule, IonicModule],
      declarations: [SplashPageComponent],
      providers: [
        NavController,
        { provide: KafkaService, useClass: KafkaServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(SplashPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof SplashPageComponent).toBe(true)
  })
})
