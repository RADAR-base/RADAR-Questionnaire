import { TestBed } from '@angular/core/testing'

import {
  HttpServiceMock,
  LogServiceMock,
  RemoteConfigServiceMock,
  SubjectConfigServiceMock
} from '../../../shared/testing/mock-services'
import { HttpService } from '../http/http.service'
import { LogService } from '../misc/log.service'
import { ProtocolService } from './protocol.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'

describe('ProtocolService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ProtocolService,
        { provide: HttpService, useClass: HttpServiceMock },
        { provide: SubjectConfigService, useClass: SubjectConfigServiceMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: LogService, useClass: LogServiceMock }
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
