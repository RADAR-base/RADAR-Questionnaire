import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule, NavController } from '@ionic/angular'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { AppModule } from '../../../app.module'
import { QRFormComponent } from '../components/qr-form/qr-form.component'
import { TokenFormComponent } from '../components/token-form/token-form.component'
import { EnrolmentPageComponent } from './enrolment-page.component'
import { KafkaService } from 'src/app/core/services/kafka/kafka.service'
import { KafkaServiceMock } from 'src/app/shared/testing/mock-services'

describe('EnrolmentPagecomponent', () => {
  let component
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        IonicModule,
        PipesModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        EnrolmentPageComponent,
        TokenFormComponent,
        QRFormComponent
      ],
      providers: [
        NavController,
        { provide: KafkaService, useClass: KafkaServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(EnrolmentPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof EnrolmentPageComponent).toBe(true)
  })
})
