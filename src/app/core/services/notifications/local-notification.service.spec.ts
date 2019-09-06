import { TestBed } from '@angular/core/testing'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'

import {
  LocalNotificationsMock,
  LogServiceMock,
  NotificationGeneratorServiceMock,
  ScheduleServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { LocalNotificationService } from './local-notification.service'
import { NotificationGeneratorService } from './notification-generator.service'

describe('LocalNotificationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        LocalNotificationService,
        { provide: LocalNotifications, useClass: LocalNotificationsMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: StorageService, useClass: StorageServiceMock },
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
