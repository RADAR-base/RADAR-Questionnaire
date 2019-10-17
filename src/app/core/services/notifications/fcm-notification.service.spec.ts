import { TestBed } from '@angular/core/testing'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Platform } from 'ionic-angular'
import { PlatformMock } from 'ionic-mocks'

import {
  FirebaseMock,
  LogServiceMock,
  NotificationGeneratorServiceMock,
  RemoteConfigServiceMock,
  ScheduleServiceMock,
  StorageServiceMock,
  SubjectConfigServiceMock
} from '../../../shared/testing/mock-services'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { FcmNotificationService } from './fcm-notification.service'
import { NotificationGeneratorService } from './notification-generator.service'

describe('FcmNotificationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        FcmNotificationService,
        { provide: Platform, useClass: PlatformMock },
        { provide: Firebase, useClass: FirebaseMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: SubjectConfigService, useClass: SubjectConfigServiceMock },
        {
          provide: NotificationGeneratorService,
          useClass: NotificationGeneratorServiceMock
        },
        { provide: ScheduleService, useClass: ScheduleServiceMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(FcmNotificationService)
  })

  it('should create', () => {
    expect(service instanceof FcmNotificationService).toBe(true)
  })
})
