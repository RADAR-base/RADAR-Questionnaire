import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  ConverterFactoryServiceMock,
  LocalizationServiceMock,
  LogServiceMock,
  QuestionnaireServiceMock,
  RemoteConfigServiceMock,
  StorageServiceMock,
  SubjectConfigServiceMock,
  UtilityMock
} from '../../../shared/testing/mock-services'
import { Utility } from '../../../shared/utilities/util'
import { QuestionnaireService } from '../config/questionnaire.service'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { ConverterFactoryService } from './converters/converter-factory.service.'
import { SchemaService } from './schema.service'
import { StorageService } from '../storage/storage.service'

describe('SchemaService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        SchemaService,
        { provide: QuestionnaireService, useClass: QuestionnaireServiceMock },
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock },
        { provide: LocalizationService, useClass: LocalizationServiceMock },
        { provide: SubjectConfigService, useClass: SubjectConfigServiceMock },
        { provide: RemoteConfigService, useClass: RemoteConfigServiceMock },
        {
          provide: ConverterFactoryService,
          useClass: ConverterFactoryServiceMock
        },
        { provide: Utility, useClass: UtilityMock },
        HttpClient,
        HttpHandler
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(SchemaService)
  })

  it('should create', () => {
    expect(service instanceof SchemaService).toBe(true)
  })
})
