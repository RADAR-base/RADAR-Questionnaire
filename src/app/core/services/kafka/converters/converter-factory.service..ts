import { Injectable } from '@angular/core'
import { SchemaType } from 'src/app/shared/models/kafka'

import { AppEventConverterService } from './app-event-converter.service'
import { AssessmentConverterService } from './assessment-converter.service'
import { CompletionLogConverterService } from './completion-log-converter.service'
import { HealthkitConverterService } from './healthkit-converter.service'
import { TimezoneConverterService } from './timezone-converter.service'

@Injectable()
export class ConverterFactoryService {
  constructor(
    private assessmentConverter: AssessmentConverterService,
    private healthkitConverter: HealthkitConverterService,
    private appEventConverter: AppEventConverterService,
    private completionLogConverter: CompletionLogConverterService,
    private timzoneConverter: TimezoneConverterService,
  ) { }

  init() { }

  getConverter(type) {
    switch (this.classify(type)) {
      case SchemaType.HEALTHKIT:
        return this.healthkitConverter
      case SchemaType.ASSESSMENT:
        return this.assessmentConverter
      case SchemaType.COMPLETION_LOG:
        return this.completionLogConverter
      case SchemaType.TIMEZONE:
        return this.timzoneConverter
      case SchemaType.APP_EVENT:
        return this.appEventConverter
      default:
        return this.assessmentConverter
    }
  }

  classify(type) {
    if (type.includes(SchemaType.HEALTHKIT)) return SchemaType.HEALTHKIT
    else return type
  }

  reset() {
    this.healthkitConverter.reset()
    this.assessmentConverter.reset()
    this.completionLogConverter.reset()
    this.timzoneConverter.reset()
    this.appEventConverter.reset()
    this.assessmentConverter.reset()
  }
}
