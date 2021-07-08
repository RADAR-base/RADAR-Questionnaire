import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  FirebaseAnalyticsServiceMock,
  GithubClientMock,
  LogServiceMock,
  RemoteConfigServiceMock,
  SubjectConfigServiceMock,
  UtilityMock
} from '../../../shared/testing/mock-services'
import { Utility } from '../../../shared/utilities/util'
import { GithubClient } from '../misc/github-client.service'
import { LogService } from '../misc/log.service'
import { AnalyticsService } from '../usage/analytics.service'
import { ProtocolService } from './protocol.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'

describe('ProtocolService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ProtocolService,
        HttpClient,
        HttpHandler,
        { provide: SubjectConfigService, useClass: SubjectConfigServiceMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        {
          provide: AnalyticsService,
          useClass: FirebaseAnalyticsServiceMock
        },
        { provide: Utility, useClass: UtilityMock },
        { provide: GithubClient, useClass: GithubClientMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(ProtocolService)
  })

  it('should create', () => {
    expect(service instanceof ProtocolService).toBe(true)
  })
})
