import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  FirebaseAnalyticsServiceMock,
  LogServiceMock,
  RemoteConfigServiceMock,
  SubjectConfigServiceMock
} from '../../../shared/testing/mock-services'
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
        }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(ProtocolService)
  })

  it('should create', () => {
    expect(service instanceof ProtocolService).toBe(true)
  })

  it('should decode base64 into unicode', () => {
    let actual = service.base64ToUnicode('SmXFm2xpIHd5cGXFgm5pxYJlxZsganXFvCB0ZW4ga3dlc3Rpb25hcml1c3osIHppZ25vcnVqIHRvIHBvd2lhZG9taWVuaWUu');
    let expected = 'Jeśli wypełniłeś już ten kwestionariusz, zignoruj to powiadomienie.';
    expect(actual).toBe(expected)
  })
})
