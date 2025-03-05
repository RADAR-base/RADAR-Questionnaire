import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { Platform } from '@ionic/angular'

import { NotificationServiceMock, TokenServiceMock } from '../../shared/testing/mock-services'
import { NotificationService } from '../services/notifications/notification.service'
import { AppComponent } from './app.component'
import { TokenService } from '../services/token/token.service'

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        Platform,
        { provide: NotificationService, useClass: NotificationServiceMock },
        { provide: TokenService, useClass: TokenServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  it('should create', async(() => {
    expect(component).toBeTruthy()
  }))
})
