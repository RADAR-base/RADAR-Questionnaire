import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'

import {
  DefaultEndPoint,
  KAFKA_ASSESSMENT,
  KAFKA_CLIENT_KAFKA,
  KAFKA_COMPLETION_LOG,
  KAFKA_TIMEZONE
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import {
  AnswerKeyExport,
  AnswerValueExport,
  ApplicationTimeZoneValueExport,
  CompletionLogValueExport
} from '../../shared/models/answer'
import { QuestionType } from '../../shared/models/question'
import { Task } from '../../shared/models/task'
import { getSeconds } from '../../shared/utilities/time'
import { Utility } from '../../shared/utilities/util'
import { StorageService } from './storage.service'
import { SchemaMetadata } from '../../shared/models/kafka'
import { AuthService } from "../../pages/auth/services/auth.service";

@Injectable()
export class KafkaService {
  private KAFKA_CLIENT_URL: string
  private cacheSending = false
  private schemas: {[key: string]: Promise<[SchemaMetadata, SchemaMetadata]>} = {}

  constructor(
    private util: Utility,
    private storage: StorageService,
    private authService: AuthService
  ) {
    this.updateURI()
  }

  updateURI() {
    this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const endPoint = uri ? uri : DefaultEndPoint
      this.KAFKA_CLIENT_URL = endPoint + KAFKA_CLIENT_KAFKA
    })
  }

  prepareAnswerKafkaObjectAndSend(task: Task, data, questions) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const Answer: AnswerValueExport = {
      name: task.name,
      version: data.configVersion,
      answers: data.answers,
      time:
        questions[0].field_type == QuestionType.info && questions[1] // NOTE: Do not use info startTime
          ? data.answers[1].startTime
          : data.answers[0].startTime, // NOTE: whole questionnaire startTime and endTime
      timeCompleted: data.answers[data.answers.length - 1].endTime,
      timeNotification: getSeconds({ milliseconds: task.timestamp })
    }

    return this.prepareKafkaObjectAndSend(task, Answer, KAFKA_ASSESSMENT)
  }

  prepareNonReportedTasksKafkaObjectAndSend(task: Task) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const CompletionLog: CompletionLogValueExport = {
      name: task.name.toString(),
      time: getSeconds({ milliseconds: task.timestamp }),
      completionPercentage: { double: task.completed ? 100 : 0 }
    }
    return this.prepareKafkaObjectAndSend(
      task,
      CompletionLog,
      KAFKA_COMPLETION_LOG
    )
  }

  prepareTimeZoneKafkaObjectAndSend() {
    const ApplicationTimeZone: ApplicationTimeZoneValueExport = {
      time: getSeconds({ milliseconds: new Date().getTime() }),
      offset: getSeconds({ minutes: new Date().getTimezoneOffset() })
    }
    return this.prepareKafkaObjectAndSend(
      [],
      ApplicationTimeZone,
      KAFKA_TIMEZONE
    )
  }

  getSpecs(task: Task, kafkaObject, type) {
    switch (type) {
      case KAFKA_ASSESSMENT:
        return this.storage.getAssessmentAvsc(task).then(specs => {
          return Promise.resolve(
            Object.assign({}, { task: task, kafkaObject: kafkaObject }, specs)
          )
        })
      case KAFKA_COMPLETION_LOG:
      case KAFKA_TIMEZONE:
        return Promise.resolve({
          name: type,
          avsc: 'questionnaire',
          task: task,
          kafkaObject: kafkaObject
        })
      default:
        break
    }
  }

  prepareKafkaObjectAndSend(task, value, type) {
    return this.util.getObservationKey()
      .then(observationKey => {
        // NOTE: Payload for kafka 2 : key Object which contains device information
        const kafkaObject = {key: observationKey as AnswerKeyExport, value}
        return this.getSpecs(task, kafkaObject, type)
      })
      .then(specs => this.createPayloadAndSend(specs))
  }

  createPayloadAndSend(specs) {
    let schemaVersions
    if (specs.name == KAFKA_COMPLETION_LOG && this.schemas[KAFKA_COMPLETION_LOG]) {
      schemaVersions = this.schemas[KAFKA_COMPLETION_LOG]
    } else {
      schemaVersions = this.util
        .getLatestKafkaSchemaVersions(specs)
        .catch(error => {
          console.log(error)
          return this.cacheAnswers(specs)
        })
      this.schemas[specs.name] = schemaVersions
    }
    return schemaVersions
      .then(([keySchemaMetadata, valueSchemaMetadata]) => {
        const keySchema = JSON.parse(keySchemaMetadata.schema)
        const valueSchema = JSON.parse(valueSchemaMetadata.schema)

        const avroKey = AvroSchema.parse(keySchema, { wrapUnions: true })
        const avroVal = AvroSchema.parse(valueSchema, { wrapUnions: true })

        const kafkaObject = specs.kafkaObject
        const bufferKey = avroKey.clone(kafkaObject.key, { wrapUnions: true })
        const bufferVal = avroVal.clone(kafkaObject.value, { wrapUnions: true })
        const payload = {
          key: bufferKey,
          value: bufferVal
        }
        const parsedKeySchema = new KafkaRest.AvroSchema(keySchema)
        const parsedValueSchema = new KafkaRest.AvroSchema(valueSchema)
        return this.sendToKafka(specs, parsedKeySchema, parsedValueSchema, payload)
      })
  }

  sendToKafka(specs, keySchema, valueSchema, payload) {
    return this.getKafkaInstance()
      .then(kafka => new Promise((resolve, reject) => {
          // NOTE: Kafka connection instance to submit to topic
          const topic = specs.avsc + '_' + specs.name
          console.log('Sending to: ' + topic)
          return kafka
            .topic(topic)
            .produce(keySchema, valueSchema, payload, (err, res) => {
              if (err) {
                reject(err)
              } else {
                resolve(res)
              }
            })
      }))
      .then(() => this.removeAnswersFromCache(specs.kafkaObject.value.time))
      .catch(error => {
        console.error('Could not initiate kafka connection ' + JSON.stringify(error))
        return this.cacheAnswers(specs)
          .then(() => ({res: 'ERROR'}))
      });
  }

  cacheAnswers(specs) {
    const kafkaObject = specs.kafkaObject
    return this.storage.get(StorageKeys.CACHE_ANSWERS)
      .then(cache => {
        console.log('KAFKA-SERVICE: Caching answers.')
        cache[kafkaObject.value.time] = specs
        return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
      })
  }

  sendAllAnswersInCache() {
    if (!this.cacheSending) {
      this.cacheSending = !this.cacheSending
      this.sendToKafkaFromCache()
        .catch(e => console.log('Cache could not be sent.'))
        .then(() => (this.cacheSending = !this.cacheSending))
    }
  }

  sendToKafkaFromCache() {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      const promises = Object.entries(cache)
        .filter(([k, v]) => k)
        .slice(0, 20)
        .map(([k, v]) => this.createPayloadAndSend(v))
      return Promise.all(promises).then(res => {
        console.log(res)
        return res
      })
    })
  }

  removeAnswersFromCache(cacheKey) {
    return this.storage.get(StorageKeys.CACHE_ANSWERS)
      .then(cache => {
        if (cache) {
          console.log('Deleting ' + cacheKey)
          if (cache[cacheKey]) {
            delete cache[cacheKey]
          }
          return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
        }
      })
  }

  getKafkaInstance() {
    return this.authService
      .refresh()
      .then(() => this.prepareHeaders())
      .then(headers => {
        return new KafkaRest({ url: this.KAFKA_CLIENT_URL, headers: headers })
      })
  }

  prepareHeaders() {
    return Promise.all( [this.storage.get(StorageKeys.OAUTH_TOKENS), this.storage.get(StorageKeys.PROJECTNAME)])
      .then( ([token, projectName]) => {
        const headers = {
          Authorization: 'Bearer ' + token.access_token,
          'RADAR-Project': projectName
        }
        return headers
      })
  }

  storeQuestionareData(values) {
    // TODO: Decide on whether to save Questionare data locally or send it to server
  }
}
