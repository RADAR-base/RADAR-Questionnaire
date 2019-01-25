import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'

import {
  DefaultEndPoint,
  KAFKA_ASSESSMENT,
  KAFKA_CLIENT_KAFKA,
  KAFKA_COMPLETION_LOG,
  KAFKA_TIMEZONE,
  MIN_SEC,
  SEC_MILLISEC
} from '../../../assets/data/defaultConfig'
import { AuthService } from '../../pages/auth/services/auth.service'
import { StorageKeys } from '../../shared/enums/storage'
import {
  AnswerKeyExport,
  AnswerValueExport,
  ApplicationTimeZoneValueExport,
  CompletionLogValueExport
} from '../../shared/models/answer'
import { QuestionType } from '../../shared/models/question'
import { Task } from '../../shared/models/task'
import { Utility } from '../../shared/utilities/util'
import { StorageService } from './storage.service'

@Injectable()
export class KafkaService {
  private KAFKA_CLIENT_URL: string
  private cacheSending = false
  private schemas = {}

  constructor(
    private util: Utility,
    public storage: StorageService,
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
      timeNotification: task.timestamp
        ? { double: task.timestamp / SEC_MILLISEC }
        : null
    }

    return this.prepareKafkaObjectAndSend(task, Answer, KAFKA_ASSESSMENT)
  }

  prepareNonReportedTasksKafkaObjectAndSend(task: Task) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const CompletionLog: CompletionLogValueExport = {
      name: task.name.toString(),
      time: task.timestamp / SEC_MILLISEC,
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
      time: new Date().getTime() / SEC_MILLISEC,
      offset: new Date().getTimezoneOffset() * MIN_SEC
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
      const kafkaObject = { value: value, key: answerKey }
      return this.getSpecs(task, kafkaObject, type).then(specs =>
        this.cacheAnswers(specs).then(() => this.createPayloadAndSend(specs))
      )
    })
  }

  createPayloadAndSend(specs) {
    let schemaVersions
    switch (specs.name) {
      case KAFKA_COMPLETION_LOG:
        if (this.schemas[specs.name]) {
          schemaVersions = this.schemas[specs.name]
          break
        }
      default:
        schemaVersions = this.util
          .getLatestKafkaSchemaVersions(specs)
          .catch(error => {
            console.log(error)
            this.cacheAnswers(specs)
            return Promise.resolve()
          })
        this.schemas[specs.name] = schemaVersions
    }
    return Promise.all([schemaVersions]).then(data => {
      schemaVersions = data[0]
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
      const kafkaObject = specs.kafkaObject
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
      return this.sendToKafka(specs, schemaId, schemaInfo, payload)
    })
  }

  sendToKafka(specs, id, info, payload) {
    return this.getKafkaInstance().then(
      kafkaConnInstance => {
        // NOTE: Kafka connection instance to submit to topic
        const topic = specs.avsc + '_' + specs.name
        console.log('Sending to: ' + topic)
        return kafkaConnInstance
          .topic(topic)
          .produce(id, info, payload, (err, res) => {
            if (err) {
              console.log(err)
              return this.cacheAnswers(specs)
            } else {
              const cacheKey = specs.kafkaObject.value.time
              return this.removeAnswersFromCache(cacheKey)
            }
          })
      },
      error => {
        this.cacheAnswers(specs)
        console.error(
          'Could not initiate kafka connection ' + JSON.stringify(error)
        )
        return Promise.resolve({ res: 'ERROR' })
      }
    )
  }

  cacheAnswers(specs) {
    const kafkaObject = specs.kafkaObject
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
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
      const promises = []
      let noOfTasks = 0
      for (const answerKey in cache) {
        if (answerKey) {
          const cacheObject = cache[answerKey]
          promises.push(this.createPayloadAndSend(cacheObject))
          noOfTasks += 1
          if (noOfTasks === 20) {
            break
          }
        }
      }
      return Promise.all(promises).then(res => {
        console.log(res)
        return Promise.resolve(res)
      })
    })
  }

  removeAnswersFromCache(cacheKey) {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      if (cache) {
        console.log('Deleting ' + cacheKey)
        if (cache[cacheKey]) delete cache[cacheKey]
        return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
      }
    })
  }

  getKafkaInstance() {
    return this.authService
      .refresh()
      .then(() => this.storage.get(StorageKeys.OAUTH_TOKENS))
      .then(tokens => {
        const headers = { Authorization: 'Bearer ' + tokens.access_token }
        return new KafkaRest({ url: this.KAFKA_CLIENT_URL, headers: headers })
      })
  }

  storeQuestionareData(values) {
    // TODO: Decide on whether to save Questionare data locally or send it to server
  }
}
