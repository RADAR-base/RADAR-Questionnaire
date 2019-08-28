import { TestBed } from '@angular/core/testing'
import { AppVersion } from '@ionic-native/app-version/ngx'

import {
  AppVersionMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { StorageService } from '../storage/storage.service'
import { AppConfigService } from './app-config.service'

describe('AppConfigService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        AppConfigService,
        { provide: AppVersion, useClass: AppVersionMock },
        { provide: StorageService, useClass: StorageServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(AppConfigService)
  })

  it('should create', () => {
    expect(service instanceof AppConfigService).toBe(true)
  })
})
