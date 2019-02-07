import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'

import {
  AnswerKeyExport,
  AnswerValueExport
} from '../../../shared/models/answer'
import { CompletionLogValueExport } from '../../../shared/models/completion-log'
import { SchemaMetadata, SchemaType } from '../../../shared/models/kafka'
import { Task } from '../../../shared/models/task'
import { ApplicationTimeZoneValueExport } from '../../../shared/models/timezone'
import { UsageEventValueExport } from '../../../shared/models/usage-event'
import { getTaskType } from '../../../shared/utilities/task-type'
import { getSeconds } from '../../../shared/utilities/time'
import { Utility } from '../../../shared/utilities/util'
import { QuestionnaireService } from '../config/questionnaire.service'

@Injectable()
export class SchemaService {
  private schemas: {
    [key: string]: Promise<[SchemaMetadata, SchemaMetadata]>
  } = {}

  constructor(
    private util: Utility,
    public questionnaire: QuestionnaireService
  ) {}

  getSpecs(type, task?: Task) {
    // NOTE: Specs { avsc: string, name: string }
    switch (type) {
      case SchemaType.ASSESSMENT:
        return this.getAssessmentAvro(task)
      default:
        return Promise.resolve({ name: type, avsc: 'questionnaire' })
    }
  }

  getAssessmentAvro(task: Task) {
    return this.questionnaire
      .getAssessment(getTaskType(task), task)
      .then(assessment => {
        return assessment.questionnaire
      })
  }

  getKafkaObjectKey() {
    return this.util
      .getObservationKey()
      .then(observationKey => observationKey as AnswerKeyExport)
  }

  getKafkaObjectValue(type, payload) {
    switch (type) {
      case SchemaType.ASSESSMENT:
        const Answer: AnswerValueExport = {
          name: payload.task.name,
          version: payload.data.configVersion,
          answers: payload.data.answers,
          time: payload.data.time,
          timeCompleted: payload.data.timeCompleted,
          timeNotification: getSeconds({ milliseconds: payload.task.timestamp })
        }
        return Answer
      case SchemaType.COMPLETION_LOG:
        const CompletionLog: CompletionLogValueExport = {
          name: payload.name,
          time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
          timeNotification: getSeconds({
            milliseconds: payload.timeNotification
          }),
          completionPercentage: { double: payload.percentage }
        }
        return CompletionLog
      case SchemaType.TIMEZONE:
        const ApplicationTimeZone: ApplicationTimeZoneValueExport = {
          time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
          offset: getSeconds({ minutes: new Date().getTimezoneOffset() })
        }
        return ApplicationTimeZone
      case SchemaType.USAGE:
        const Event: UsageEventValueExport = {
          time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
          eventType: payload.eventType
        }
        return Event
    }
  }

  getAvroObject(schema, value) {
    const options = { wrapUnions: true }
    return AvroSchema.parse(schema, options).clone(value, options)
  }

  convertToAvro(kafkaObject, specs) {
    if (!this.schemas[specs.name]) {
      this.schemas[specs.name] = this.util
        .getLatestKafkaSchemaVersions(specs)
        .catch(error => {
          // TODO: add fallback for error
          console.log(error)
          return Promise.resolve({} as [SchemaMetadata, SchemaMetadata])
        })
    }
    return this.schemas[specs.name].then(
      ([keySchemaMetadata, valueSchemaMetadata]) => {
        const key = JSON.parse(keySchemaMetadata.schema)
        const value = JSON.parse(valueSchemaMetadata.schema)
        const schemaId = new KafkaRest.AvroSchema(key)
        const schemaInfo = new KafkaRest.AvroSchema(value)
        const payload = {
          key: this.getAvroObject(key, kafkaObject.key),
          value: this.getAvroObject(value, kafkaObject.value)
        }
        return { schemaId, schemaInfo, payload }
      }
    )
  }

  getUniqueTimeNow() {
    return new Date().getTime() + Math.random()
  }
}
