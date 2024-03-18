import { TestBed } from '@angular/core/testing'
import { Platform } from '@ionic/angular'

import {
  FirebaseMock,
  LocalizationServiceMock,
  LogServiceMock,
  NotificationGeneratorServiceMock,
  RemoteConfigServiceMock,
  ScheduleServiceMock,
  StorageServiceMock,
  SubjectConfigServiceMock
} from '../../../shared/testing/mock-services'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { GlobalStorageService } from '../storage/global-storage.service'
import { StorageService } from '../storage/storage.service'
import { FcmNotificationService } from './fcm-notification.service'
import { NotificationGeneratorService } from './notification-generator.service'

describe('FcmNotificationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        FcmNotificationService,
        Platform,
        { provide: LogService, useClass: LogServiceMock },
        { provide: GlobalStorageService, useClass: StorageServiceMock },
        { provide: SubjectConfigService, useClass: SubjectConfigServiceMock },
        {
          provide: NotificationGeneratorService,
          useClass: NotificationGeneratorServiceMock
        },
        { provide: ScheduleService, useClass: ScheduleServiceMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: LocalizationService, useClass: LocalizationServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(FcmNotificationService)
    const platform = TestBed.get(Platform)
    spyOn(platform, 'ready').and.callFake(() => Promise.resolve(''))
  })

  it('should create', () => {
    expect(service instanceof FcmNotificationService).toBe(true)
  })
})
