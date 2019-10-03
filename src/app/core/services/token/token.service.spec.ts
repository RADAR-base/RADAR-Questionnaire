import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { JwtHelperService } from '@auth0/angular-jwt'

import {
  JwtHelperServiceMock,
  LogServiceMock,
  RemoteConfigServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from './token.service'

describe('TokenService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        TokenService,
        HttpClient,
        HttpHandler,
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: JwtHelperService, useClass: JwtHelperServiceMock },
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(TokenService)
  })

  it('should create', () => {
    expect(service instanceof TokenService).toBe(true)
  })
})
