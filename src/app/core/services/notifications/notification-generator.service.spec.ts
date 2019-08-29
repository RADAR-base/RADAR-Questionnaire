import { TestBed } from '@angular/core/testing'

import {
  LocalizationServiceMock,
  LogServiceMock
} from '../../../shared/testing/mock-services'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { NotificationGeneratorService } from './notification-generator.service'

describe('NotificationGeneratorService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        NotificationGeneratorService,
        { provide: LocalizationService, useClass: LocalizationServiceMock },
        { provide: LogService, useClass: LogServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(NotificationGeneratorService)
  })

  it('should create', () => {
    expect(service instanceof NotificationGeneratorService).toBe(true)
  })
})
