import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  LocalizationServiceMock,
  LogServiceMock,
  StorageServiceMock,
  UtilityMock
} from '../../../shared/testing/mock-services'
import { Utility } from '../../../shared/utilities/util'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { QuestionnaireService } from './questionnaire.service'

describe('QuestionnaireService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        QuestionnaireService,
        HttpClient,
        HttpHandler,
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LocalizationService, useClass: LocalizationServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: Utility, useClass: UtilityMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(QuestionnaireService)
  })

  it('should create', () => {
    expect(service instanceof QuestionnaireService).toBe(true)
  })
})
