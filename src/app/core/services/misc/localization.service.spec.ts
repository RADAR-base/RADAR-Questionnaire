import { TestBed } from '@angular/core/testing'

import {
  LogServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { StorageService } from '../storage/storage.service'
import { LocalizationService } from './localization.service'
import { LogService } from './log.service'

describe('LocalizationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        LocalizationService,
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(LocalizationService)
  })

  it('should create', () => {
    expect(service instanceof LocalizationService).toBe(true)
  })

  it('should use English by default', done => {
    const testKey = 'BTN_OKAY'
    const translation = 'Okay'
    expect(service.translate(testKey)).toBe(translation)
    done()
  })
})
