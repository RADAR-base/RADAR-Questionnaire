import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  FirebaseAnalyticsServiceMock,
  LogServiceMock,
  SchemaServiceMock,
  StorageServiceMock,
  TokenServiceMock
} from '../../../shared/testing/mock-services'
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
        HttpClient,
        HttpHandler,
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
