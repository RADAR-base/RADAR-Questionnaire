import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController } from '@ionic/angular'
import { MomentModule } from 'ngx-moment'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { AppModule } from '../../../app.module'
import { SettingsService } from '../services/settings.service'
import { SettingsPageComponent } from './settings-page.component'
import { CacheSendService } from '../services/cache-send.service'
import { KafkaService } from 'src/app/core/services/kafka/kafka.service'
import { KafkaServiceMock } from 'src/app/shared/testing/mock-services'

describe('SettingsPageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppModule, IonicModule, PipesModule, MomentModule],
      declarations: [SettingsPageComponent],
      providers: [
        NavController, SettingsService, CacheSendService,
        { provide: KafkaService, useClass: KafkaServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(SettingsPageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof SettingsPageComponent).toBe(true)
  })
})
