import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  CacheServiceMock,
  FirebaseAnalyticsServiceMock,
  LogServiceMock,
  RemoteConfigServiceMock,
  SchemaServiceMock,
  StorageServiceMock,
  TokenServiceMock,
  UtilityMock
} from '../../../shared/testing/mock-services'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { TokenService } from '../token/token.service'
import { AnalyticsService } from '../usage/analytics.service'
import { CacheService } from './cache.service'
import { KafkaService } from './kafka.service'
import { SchemaService } from './schema.service'
import { Utility } from 'src/app/shared/utilities/util'

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
        { provide: CacheService, useClass: CacheServiceMock },
        { provide: SchemaService, useClass: SchemaServiceMock },
        {
          provide: AnalyticsService,
          useClass: FirebaseAnalyticsServiceMock
        },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: Utility, useClass: UtilityMock }
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
