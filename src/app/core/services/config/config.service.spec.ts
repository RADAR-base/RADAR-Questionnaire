import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { HealthkitService } from 'src/app/pages/tasks/healthkit/services/healthkit.service'

import {
  AppConfigServiceMock,
  AppServerServiceMock,
  FirebaseAnalyticsServiceMock,
  HealthkitServiceMock,
  KafkaServiceMock,
  LocalizationServiceMock,
  LogServiceMock,
  MessageHandlerServiceMock,
  NotificationServiceMock,
  ProtocolServiceMock,
  QuestionnaireServiceMock,
  RemoteConfigServiceMock,
  ScheduleServiceMock,
  SubjectConfigServiceMock,
  TokenServiceMock
} from '../../../shared/testing/mock-services'
import { AppServerService } from '../app-server/app-server.service'
import { KafkaService } from '../kafka/kafka.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { MessageHandlerService } from '../notifications/message-handler.service'
import { NotificationService } from '../notifications/notification.service'
import { ScheduleService } from '../schedule/schedule.service'
import { AnalyticsService } from '../usage/analytics.service'
import { AppConfigService } from './app-config.service'
import { ConfigService } from './config.service'
import { ProtocolService } from './protocol.service'
import { QuestionnaireService } from './questionnaire.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'
import { TokenService } from '../token/token.service'

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
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        { provide: AppServerService, useClass: AppServerServiceMock },
        { provide: MessageHandlerService, useClass: MessageHandlerServiceMock },
        { provide: HealthkitService, useClass: HealthkitServiceMock },
        { provide: TokenService, useClass: TokenServiceMock }
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
