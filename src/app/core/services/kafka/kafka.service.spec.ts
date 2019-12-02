import { TestBed } from '@angular/core/testing'

import {
  FirebaseAnalyticsServiceMock,
  HttpServiceMock,
  LogServiceMock,
  SchemaServiceMock,
  StorageServiceMock,
  TokenServiceMock
} from '../../../shared/testing/mock-services'
import { HttpService } from '../http/http.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { AnalyticsService } from '../usage/analytics.service'
import { KafkaService } from './kafka.service'
import { SchemaService } from './schema.service'

describe('KafkaService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        KafkaService,
        { provide: HttpService, useClass: HttpServiceMock },
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: TokenService, useClass: TokenServiceMock },
        { provide: SchemaService, useClass: SchemaServiceMock },
        {
          provide: AnalyticsService,
          useClass: FirebaseAnalyticsServiceMock
        }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(KafkaService)
  })

  it('should create', () => {
    expect(service instanceof KafkaService).toBe(true)
  })
})
