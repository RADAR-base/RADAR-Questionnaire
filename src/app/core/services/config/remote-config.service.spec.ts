import { TestBed } from '@angular/core/testing'
import { Firebase } from '@ionic-native/firebase/ngx'
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
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: Platform, useClass: PlatformMock },
        { provide: Firebase, useClass: FirebaseMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(FirebaseRemoteConfigService)
  })

  it('should create', () => {
    expect(service instanceof FirebaseRemoteConfigService).toBe(true)
  })
})
