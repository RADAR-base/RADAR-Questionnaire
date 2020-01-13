import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { Platform } from 'ionic-angular'
import { PlatformMock } from 'ionic-mocks'

import {
  AppConfigServiceMock,
  FirebaseAnalyticsServiceMock,
  KafkaServiceMock,
  LocalizationServiceMock,
  LogServiceMock,
  NotificationServiceMock,
  ProtocolServiceMock,
  QuestionnaireServiceMock,
  ScheduleServiceMock,
  SubjectConfigServiceMock,
  RemoteConfigServiceMock
} from '../../../shared/testing/mock-services'
import { KafkaService } from '../kafka/kafka.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { NotificationService } from '../notifications/notification.service'
import { ScheduleService } from '../schedule/schedule.service'
import { AnalyticsService } from '../usage/analytics.service'
import { AppConfigService } from './app-config.service'
import { ConfigService } from './config.service'
import { ProtocolService } from './protocol.service'
import { QuestionnaireService } from './questionnaire.service'
import { SubjectConfigService } from './subject-config.service'
import { RemoteConfigService } from './remote-config.service';

describe('ConfigService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        { provide: ScheduleService, useClass: ScheduleServiceMock },
        { provide: NotificationService, useClass: NotificationServiceMock },
        { provide: ProtocolService, useClass: ProtocolServiceMock },
        { provide: QuestionnaireService, useClass: QuestionnaireServiceMock },
        { provide: AppConfigService, useClass: AppConfigServiceMock },
        { provide: SubjectConfigService, useClass: SubjectConfigServiceMock },
        { provide: KafkaService, useClass: KafkaServiceMock },
        { provide: LocalizationService, useClass: LocalizationServiceMock },
        {
          provide: AnalyticsService,
          useClass: FirebaseAnalyticsServiceMock
        },
        { provide: LogService, useClass: LogServiceMock },
        HttpClient,
        HttpHandler,
        { provide: Platform, useClass: PlatformMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
      ]
    })
  )
  beforeEach(() => {
    service = TestBed.get(ConfigService)
  })

  it('should create', () => {
    expect(service instanceof ConfigService).toBe(true)
  })
})
