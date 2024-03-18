import { TestBed } from '@angular/core/testing'
import { Platform } from '@ionic/angular'

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
        { provide: LogService, useClass: LogServiceMock },
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
