import { TestBed } from '@angular/core/testing'
import { WebIntent } from '@ionic-native/web-intent/ngx'

import {
  FirebaseAnalyticsServiceMock,
  KafkaServiceMock,
  LogServiceMock,
  WebIntentMock
} from '../../../shared/testing/mock-services'
import { KafkaService } from '../kafka/kafka.service'
import { LogService } from '../misc/log.service'
import { UsageService } from './usage.service'
import { AnalyticsService } from './analytics.service';

describe('UsageService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        UsageService,
        {
          provide: AnalyticsService,
          useClass: FirebaseAnalyticsServiceMock
        },
        { provide: KafkaService, useClass: KafkaServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: WebIntent, useClass: WebIntentMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(UsageService)
  })

  it('should create', () => {
    expect(service instanceof UsageService).toBe(true)
  })
})
