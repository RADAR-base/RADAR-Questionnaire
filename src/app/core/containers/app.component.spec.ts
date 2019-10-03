import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { MobileAccessibility } from '@ionic-native/mobile-accessibility/ngx'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Platform } from 'ionic-angular'

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
        StatusBar,
        Platform,
        SplashScreen,
        MobileAccessibility,
        NotificationService
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  it('should create', async(() => {
    expect(component).toBeTruthy()
  }))
})
