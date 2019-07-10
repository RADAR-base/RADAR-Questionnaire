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
import { SchemaMetadata } from '../../shared/models/kafka'
import { QuestionType } from '../../shared/models/question'
import { Task } from '../../shared/models/task'
import { getSeconds } from '../../shared/utilities/time'
import { Utility } from '../../shared/utilities/util'
import { FirebaseAnalyticsService } from './firebaseAnalytics.service'
import { StorageService } from './storage.service'
import { TokenService } from './token.service'

@Injectable()
export class KafkaService {
  private KAFKA_CLIENT_URL: string
  private cacheSending = false
  private schemas: {
    [key: string]: Promise<[SchemaMetadata, SchemaMetadata]>
  } = {}

  constructor(
    private util: Utility,
    private storage: StorageService,
    private token: TokenService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {
    this.updateURI()
    this.token.refresh()
  }

  updateURI() {
    this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const endPoint = uri ? uri : DefaultEndPoint
      this.KAFKA_CLIENT_URL = endPoint + KAFKA_CLIENT_KAFKA
    })
  }

  prepareAnswerKafkaObjectAndSend(task: Task, data, questions) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const time =
      questions[0].field_type == QuestionType.info && questions[1] // NOTE: Do not use info startTime
        ? data.answers[1].startTime
        : data.answers[0].startTime // NOTE: whole questionnaire startTime and endTime
    const timeNotification = getSeconds({ milliseconds: task.timestamp })
    const timeCompleted = data.answers[data.answers.length - 1].endTime
    const Answer: AnswerValueExport = {
      time: time,
      timeCompleted: timeCompleted,
      timeNotification: timeNotification,
      name: task.name,
      version: data.configVersion,
      answers: data.answers
    }
    return this.prepareKafkaObjectAndSend(task, Answer, KAFKA_ASSESSMENT)
  }

  prepareNonReportedTasksKafkaObjectAndSend(task: Task) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const CompletionLog: CompletionLogValueExport = {
      name: task.name.toString(),
      time: getSeconds({ milliseconds: new Date().getTime() + Math.random() }),
      timeNotification: getSeconds({ milliseconds: task.timestamp }),
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
    this.firebaseAnalytics.logEvent('prepared_kafka_object', {
      name: task.name,
      questionnaire_timestamp: String(task.timestamp),
      type: type
    })
    return this.util
      .getObservationKey()
      .then(observationKey => {
        // NOTE: Payload for kafka 2 : key Object which contains device information
        const kafkaObject = { key: observationKey as AnswerKeyExport, value }
        return this.getSpecs(task, kafkaObject, type)
      })
      .then(specs =>
        this.cacheAnswers(specs).then(() => this.sendAllAnswersInCache())
      )
  }

  createPayloadAndSend(specs, kafkaConnInstance) {
    return this.util.getKafkaTopic(specs).then(topic => {
      let schemaVersions
      switch (specs.name) {
        case KAFKA_COMPLETION_LOG:
          if (this.schemas[specs.name]) {
            schemaVersions = this.schemas[specs.name]
            break
          }
        default:
          schemaVersions = this.util
            .getLatestKafkaSchemaVersions(topic)
            .catch(error => {
              console.log(error)
              return Promise.resolve()
            })
          this.schemas[specs.name] = schemaVersions
      }
      return schemaVersions.then(([keySchemaMetadata, valueSchemaMetadata]) => {
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

        return this.sendToKafka(
          specs,
          parsedKeySchema,
          parsedValueSchema,
          payload,
          kafkaConnInstance,
          topic
        ).catch(error => {
          console.error(
            'Could not initiate kafka connection ' + JSON.stringify(error)
          )
          this.firebaseAnalytics.logEvent('send_error', {
            error: String(error),
            name: specs.name,
            questionnaire_timestamp: specs.task
              ? specs.task.timestamp
                ? String(specs.task.timestamp)
                : Date.now()
              : Date.now()
          })
          return Promise.resolve()
        })
      })
    })
  }

  sendToKafka(specs, id, info, payload, kafkaConnInstance, topic) {
    return new Promise((resolve, reject) => {
      // NOTE: Kafka connection instance to submit to topic
      console.log('Sending to: ' + topic)
      return kafkaConnInstance
        .topic(topic)
        .produce(id, info, payload, (err, res) => {
          if (err) {
            console.log(err)
            return reject(err)
          } else {
            const cacheKey = specs.kafkaObject.value.time
            this.setLastUploadDate(specs)
            this.firebaseAnalytics.logEvent('send_success', {
              topic: topic,
              name: specs.name,
              questionnaire_timestamp: specs.task
                ? specs.task.timestamp
                  ? String(specs.task.timestamp)
                  : Date.now()
                : Date.now()
            })
            return resolve(cacheKey)
          }
        })
    })
  }

  setLastUploadDate(specs) {
    if (specs.name !== KAFKA_COMPLETION_LOG && specs.name !== KAFKA_TIMEZONE) {
      return this.storage.set(StorageKeys.LAST_UPLOAD_DATE, Date.now())
    } else {
      return Promise.resolve()
    }
  }

  // TODO: Add logging of firebase events for adding to cache
  cacheAnswers(specs) {
    const kafkaObject = specs.kafkaObject
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      console.log('KAFKA-SERVICE: Caching answers.')
      cache[kafkaObject.value.time] = specs
      this.firebaseAnalytics.logEvent('send_to_cache', {
        name: specs.name,
        questionnaire_timestamp: specs.task
          ? specs.task.timestamp
            ? String(specs.task.timestamp)
            : Date.now()
          : Date.now()
      })
      return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
    })
  }

  sendAllAnswersInCache() {
    if (!this.cacheSending) {
      this.cacheSending = !this.cacheSending
      return this.sendToKafkaFromCache()
        .catch(e => console.log('Cache could not be sent.'))
        .then(() => (this.cacheSending = !this.cacheSending))
    } else {
      return Promise.resolve({})
    }
  }

  sendToKafkaFromCache() {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      const cacheEntries = Object.entries(cache)
      if (!cacheEntries.length) return
      return this.getKafkaInstance().then(kafkaConnInstance => {
        const promises = cacheEntries
          .filter(([k, v]) => k)
          .slice(0, 20)
          .map(([k, v]) => this.createPayloadAndSend(v, kafkaConnInstance))
        return Promise.all(promises.map(p => p.catch(() => undefined))).then(
          keys => this.removeAnswersFromCache(keys.filter(k => k))
        )
      })
    })
  }

  // TODO: Add logging of firebase events for removing to cache
  removeAnswersFromCache(cacheKeys: number[]) {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      if (cache) {
        cacheKeys.map(cacheKey => {
          if (cache[cacheKey]) {
            console.log('Deleting ' + cacheKey)
            delete cache[cacheKey]
          }
        })
        return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
      } else {
        return Promise.resolve({})
      }
    })
  }

  getKafkaInstance() {
    return Promise.all([this.updateURI(), this.token.refresh()])
      .then(() => this.storage.get(StorageKeys.OAUTH_TOKENS))
      .then(tokens => {
        const headers = { Authorization: 'Bearer ' + tokens.access_token }
        return new KafkaRest({ url: this.KAFKA_CLIENT_URL, headers: headers })
      })
  }
}
