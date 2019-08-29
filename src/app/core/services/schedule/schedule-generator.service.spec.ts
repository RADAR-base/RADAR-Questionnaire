import { TestBed } from '@angular/core/testing'

import {
  LocalizationServiceMock,
  LogServiceMock,
  NotificationGeneratorServiceMock,
  QuestionnaireServiceMock
} from '../../../shared/testing/mock-services'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { NotificationGeneratorService } from '../notifications/notification-generator.service'
import { ScheduleGeneratorService } from './schedule-generator.service'

describe('ScheduleGeneratorService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ScheduleGeneratorService,
        {
          provide: LocalizationService,
          useClass: LocalizationServiceMock
        },
        { provide: QuestionnaireService, useClass: QuestionnaireServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        {
          provide: NotificationGeneratorService,
          useClass: NotificationGeneratorServiceMock
        }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(ScheduleGeneratorService)
  })

  it('should create', () => {
    expect(service instanceof ScheduleGeneratorService).toBe(true)
  })
})
