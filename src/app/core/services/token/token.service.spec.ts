import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { JwtHelperService } from '@auth0/angular-jwt'
import { Platform } from '@ionic/angular'

import {
  JwtHelperServiceMock,
  LogServiceMock,
  RemoteConfigServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { TokenService } from './token.service'

describe('TokenService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        TokenService,
        HttpClient,
        HttpHandler,
        Platform,
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: JwtHelperService, useClass: JwtHelperServiceMock },
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(TokenService)
    const platform = TestBed.get(Platform)
    spyOn(platform, 'ready').and.callFake(() => Promise.resolve(''))
  })

  it('should create', () => {
    expect(service instanceof TokenService).toBe(true)
  })
})
