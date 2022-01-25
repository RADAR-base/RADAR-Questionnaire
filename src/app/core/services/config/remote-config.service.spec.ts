import { TestBed } from '@angular/core/testing'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Platform } from 'ionic-angular'
import { PlatformMock } from 'ionic-mocks'

import {
  FirebaseMock,
  LogServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import {
  FirebaseRemoteConfigService,
  RemoteConfigService
} from './remote-config.service'

describe('RemoteConfigService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        RemoteConfigService,
        { provide: StorageService, useClass: StorageServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(RemoteConfigService)
  })

  it('should create', () => {
    expect(service instanceof RemoteConfigService).toBe(true)
  })
})

describe('FirebaseRemoteConfig', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        FirebaseRemoteConfigService,
        Platform,
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: FirebaseX, useClass: FirebaseMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(FirebaseRemoteConfigService)
    const platform = TestBed.get(Platform)
    spyOn(platform, 'ready').and.callFake(() => Promise.resolve(''))
  })

  it('should create', () => {
    expect(service instanceof FirebaseRemoteConfigService).toBe(true)
  })
})
