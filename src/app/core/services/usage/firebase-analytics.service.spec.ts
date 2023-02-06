import { TestBed } from '@angular/core/testing'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Platform } from 'ionic-angular'
import { PlatformMock } from 'ionic-mocks'

import {
  FirebaseMock,
  LogServiceMock,
  RemoteConfigServiceMock
} from '../../../shared/testing/mock-services'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { FirebaseAnalyticsService } from './firebase-analytics.service'

describe('FirebaseAnalyticsService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        FirebaseAnalyticsService,
        { provide: FirebaseX, useClass: FirebaseMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: Platform, useClass: PlatformMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(FirebaseAnalyticsService)
  })

  it('should create', () => {
    expect(service instanceof FirebaseAnalyticsService).toBe(true)
  })
})
