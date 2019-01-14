import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'

import {
  KAFKA_ASSESSMENT,
  KAFKA_COMPLETION_LOG,
  KAFKA_TIMEZONE,
  KAFKA_USAGE,
  MIN_SEC,
  SEC_MILLISEC
} from '../../../assets/data/defaultConfig'
import { AnswerKeyExport, AnswerValueExport } from '../../shared/models/answer'
import { CompletionLogValueExport } from '../../shared/models/completion-log'
import { Task } from '../../shared/models/task'
import { ApplicationTimeZoneValueExport } from '../../shared/models/timezone'
import { UsageEventValueExport } from '../../shared/models/usage-event'
import { Utility } from '../../shared/utilities/util'
import { StorageService } from './storage.service'

@Injectable()
export class SchemaService {
  private schemas = {}

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
    return this.util.getSourceKeyInfo().then(keyInfo => {
      const sourceId = keyInfo[0]
      const projectId = keyInfo[1]
      const patientId = keyInfo[2].toString()
      // NOTE: Payload for kafka 2 : key Object which contains device information
      const answerKey: AnswerKeyExport = {
        userId: patientId,
        sourceId: sourceId,
        projectId: projectId
      }
      return answerKey
    })
  }

  getKafkaObjectValue(type, payload) {
    let value
    switch (type) {
      case KAFKA_ASSESSMENT:
        const Answer: AnswerValueExport = {
          name: payload.task.name,
          version: payload.data.configVersion,
          answers: payload.data.answers,
          time: payload.data.time,
          timeCompleted: payload.data.timeCompleted,
          timeNotification: payload.task.timestamp
            ? { double: payload.task.timestamp / SEC_MILLISEC }
            : null
        }
        value = Answer
        break
      case KAFKA_COMPLETION_LOG:
        const CompletionLog: CompletionLogValueExport = {
          name: payload.task.name.toString(),
          time: payload.task.timestamp / SEC_MILLISEC,
          completionPercentage: { double: payload.task.completed ? 100 : 0 }
        }
        value = CompletionLog
        break
      case KAFKA_TIMEZONE:
        const ApplicationTimeZone: ApplicationTimeZoneValueExport = {
          time: new Date().getTime() / SEC_MILLISEC,
          offset: new Date().getTimezoneOffset() * MIN_SEC
        }
        value = ApplicationTimeZone
        break
      case KAFKA_USAGE:
        const Event: UsageEventValueExport = {
          time: payload.time,
          timeReceived: payload.time,
          packageName: payload.packageName,
          categoryName: payload.categoryName,
          eventType: payload.eventType
        }
        value = Event
        break
    }
    return value
  }

  convertToAvro(kafkaObject, specs) {
    if (!this.schemas[specs.name]) {
      this.schemas[specs.name] = this.util
        .getLatestKafkaSchemaVersions(specs)
        .catch(error => {
          console.log(error)
          return Promise.resolve()
        })
    }
    return Promise.all([this.schemas[specs.name]]).then(data => {
      const schemaVersions = data[0]
      const avroKey = AvroSchema.parse(
        JSON.parse(schemaVersions[0]['schema']),
        {
          wrapUnions: true
        }
      )
      const avroVal = AvroSchema.parse(
        JSON.parse(schemaVersions[1]['schema']),
        {
          wrapUnions: true
        }
      )
      const bufferKey = avroKey.clone(kafkaObject.key, { wrapUnions: true })
      const bufferVal = avroVal.clone(kafkaObject.value, { wrapUnions: true })
      const payload = {
        key: bufferKey,
        value: bufferVal
      }
      const schemaId = new KafkaRest.AvroSchema(
        JSON.parse(schemaVersions[0]['schema'])
      )
      const schemaInfo = new KafkaRest.AvroSchema(
        JSON.parse(schemaVersions[1]['schema'])
      )
      return { schemaId, schemaInfo, payload }
    })
  }
}
