import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'
import YAML from 'yaml'

import { DefaultSchemaSpecEndpoint } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
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
import { QuestionnaireService } from '../config/questionnaire.service'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LogService } from '../misc/log.service'

@Injectable()
export class SchemaService {
  URI_schema: string = '/schema/subjects/'
  URI_version: string = '/versions/'
  private schemas: {
    [key: string]: [Promise<SchemaMetadata>, Promise<SchemaMetadata>]
  } = {}

  constructor(
    public questionnaire: QuestionnaireService,
    private config: SubjectConfigService,
    private http: HttpClient,
    private logger: LogService,
    private remoteConfig: RemoteConfigService
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
    return Promise.all([
      this.config.getSourceID(),
      this.config.getProjectName(),
      this.config.getParticipantLogin()
    ])
      .then(([sourceId, projectName, participantName]) => ({
        sourceId,
        userId: participantName.toString(),
        projectId: projectName
      }))
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

  convertToAvro(kafkaObject, topic, baseURI) {
    if (!this.schemas[topic]) {
      const schemaKeyAndValue: [
        Promise<SchemaMetadata>,
        Promise<SchemaMetadata>
      ] = [
        this.getLatestKafkaSchemaVersion(topic + '-key', 'latest', baseURI),
        this.getLatestKafkaSchemaVersion(topic + '-value', 'latest', baseURI)
      ]
      this.schemas[topic] = schemaKeyAndValue
    }
    return Promise.all(this.schemas[topic]).then(
      ([keySchemaMetadata, valueSchemaMetadata]) => {
        if (keySchemaMetadata && valueSchemaMetadata) {
          const key = JSON.parse(keySchemaMetadata.schema)
          const value = JSON.parse(valueSchemaMetadata.schema)
          const schemaId = new KafkaRest.AvroSchema(key)
          const schemaInfo = new KafkaRest.AvroSchema(value)
          const payload = {
            key: this.getAvroObject(key, kafkaObject.key),
            value: this.getAvroObject(value, kafkaObject.value)
          }
          return { schemaId, schemaInfo, payload }
        } else {
          Promise.reject()
        }
      }
    )
  }

  getKafkaTopic(name, avsc) {
    const type = name.toLowerCase()
    const defaultTopic = `${avsc}_${name}`
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.KAFKA_SPECIFICATION_URL,
          DefaultSchemaSpecEndpoint
        )
      )
      .then(url => this.http.get(url).toPromise())
      .then(res => {
        const schemaSpecs = YAML.parse(atob(res['content'])).data
        const topic = schemaSpecs.find(t => t.type.toLowerCase() == type).topic
        if (topic) return topic
        else return Promise.reject()
      })
      .catch(e => defaultTopic)
  }

  getLatestKafkaSchemaVersion(
    questionName,
    version,
    endPoint
  ): Promise<SchemaMetadata> {
    const versionStr = this.URI_version + version
    const uri = endPoint + this.URI_schema + questionName + versionStr

    return this.http
      .get(uri)
      .toPromise()
      .catch(e =>
        // TODO: add fallback for error
        this.logger.error('Failed to get latest Kafka schema versions', e)
      )
      .then(obj => obj as SchemaMetadata)
  }

  getUniqueTimeNow() {
    return new Date().getTime() + Math.random()
  }
}
