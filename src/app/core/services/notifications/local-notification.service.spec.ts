import { TestBed } from '@angular/core/testing'

import {
  LocalNotificationsMock,
  LogServiceMock,
  NotificationGeneratorServiceMock,
  ScheduleServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { GlobalStorageService } from '../storage/global-storage.service'
import { LocalNotificationService } from './local-notification.service'
import { NotificationGeneratorService } from './notification-generator.service'

describe('LocalNotificationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        LocalNotificationService,
        { provide: LogService, useClass: LogServiceMock },
        { provide: GlobalStorageService, useClass: StorageServiceMock },
        {
          provide: NotificationGeneratorService,
          useClass: NotificationGeneratorServiceMock
        },
        { provide: ScheduleService, useClass: ScheduleServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(LocalNotificationService)
  })

  it('should create', () => {
    expect(service instanceof LocalNotificationService).toBe(true)
  })
})
