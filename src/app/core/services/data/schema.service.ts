import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'

import {
  KAFKA_ASSESSMENT,
  KAFKA_COMPLETION_LOG,
  KAFKA_TIMEZONE,
  KAFKA_USAGE
} from '../../../../assets/data/defaultConfig'
import {
  AnswerKeyExport,
  AnswerValueExport
} from '../../../shared/models/answer'
import { CompletionLogValueExport } from '../../../shared/models/completion-log'
import { SchemaMetadata } from '../../../shared/models/kafka'
import { Task } from '../../../shared/models/task'
import { ApplicationTimeZoneValueExport } from '../../../shared/models/timezone'
import { UsageEventValueExport } from '../../../shared/models/usage-event'
import { getSeconds } from '../../../shared/utilities/time'
import { Utility } from '../../../shared/utilities/util'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class SchemaService {
  private schemas: {
    [key: string]: Promise<[SchemaMetadata, SchemaMetadata]>
  } = {}

  constructor(private util: Utility, public storage: StorageService) {}

  getSpecs(type, task?: Task) {
    // NOTE: Specs { avsc: string, name: string }
    switch (type) {
      case KAFKA_ASSESSMENT:
        return this.storage.getAssessmentAvsc(task).then(specs => {
          return Promise.resolve(specs)
        })
      default:
        return Promise.resolve({ name: type, avsc: 'questionnaire' })
    }
  }

  getKafkaObjectKey() {
    return this.util
      .getObservationKey()
      .then(observationKey => observationKey as AnswerKeyExport)
  }

  getKafkaObjectValue(type, payload) {
    switch (type) {
      case KAFKA_ASSESSMENT:
        const Answer: AnswerValueExport = {
          name: payload.task.name,
          version: payload.data.configVersion,
          answers: payload.data.answers,
          time: payload.data.time,
          timeCompleted: payload.data.timeCompleted,
          timeNotification: getSeconds({ milliseconds: payload.task.timestamp })
        }
        return Answer
      case KAFKA_COMPLETION_LOG:
        const CompletionLog: CompletionLogValueExport = {
          name: payload.task.name.toString(),
          time: getSeconds({ milliseconds: payload.time }),
          completionPercentage: { double: payload.percentage }
        }
        return CompletionLog
      case KAFKA_TIMEZONE:
        const ApplicationTimeZone: ApplicationTimeZoneValueExport = {
          time: getSeconds({ milliseconds: new Date().getTime() }),
          offset: getSeconds({ minutes: new Date().getTimezoneOffset() })
        }
        return ApplicationTimeZone
      case KAFKA_USAGE:
        const Event: UsageEventValueExport = {
          time: payload.time,
          timeReceived: payload.time,
          packageName: payload.packageName,
          categoryName: payload.categoryName,
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
}
