import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { SchemaType } from 'src/app/shared/models/kafka'

import { AppEventConverterService } from './app-event-converter.service'
import { AssessmentConverterService } from './assessment-converter.service'
import { CompletionLogConverterService } from './completion-log-converter.service'
import { KeyConverterService } from './key-converter.service'
import { TimezoneConverterService } from './timezone-converter.service'

@Injectable()
export class ConverterFactoryService {
  constructor(
    private assessmentConverter: AssessmentConverterService,
    private appEventConverter: AppEventConverterService,
    private completionLogConverter: CompletionLogConverterService,
    private timzoneConverter: TimezoneConverterService,
    private keyConverter: KeyConverterService
  ) {}

  init() {}

  getConverter(type) {
    switch (type) {
      // case SchemaType.AGGREGATED_HEALTH:
      //   return this.assessmentConverter
      // case SchemaType.GENERAL_HEALTH:
      //   return this.assessmentConverter
      case SchemaType.ASSESSMENT:
        return this.assessmentConverter
      case SchemaType.COMPLETION_LOG:
        return this.completionLogConverter
      case SchemaType.TIMEZONE:
        return this.timzoneConverter
      case SchemaType.APP_EVENT:
        return this.appEventConverter
      case SchemaType.KEY:
        return this.keyConverter
      default:
        return this.assessmentConverter
    }
  }
}
