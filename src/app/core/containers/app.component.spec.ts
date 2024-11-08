import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { Platform } from '@ionic/angular'

import { NotificationServiceMock } from '../../shared/testing/mock-services'
import { NotificationService } from '../services/notifications/notification.service'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        Platform,
        { provide: NotificationService, useClass: NotificationServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  it('should create', async(() => {
    expect(component).toBeTruthy()
  }))
})
