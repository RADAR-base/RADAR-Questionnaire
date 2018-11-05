import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as KafkaRest from 'kafka-rest'

import { DefaultEndPoint } from '../../../assets/data/defaultConfig'
import { AuthService } from '../../pages/auth/services/auth.service'
import { StorageKeys } from '../../shared/enums/storage'
import {
  AnswerKeyExport,
  AnswerValueExport,
  CompletionLogValueExport
} from '../../shared/models/answer'
import { QuestionType } from '../../shared/models/question'
import { Task } from '../../shared/models/task'
import { Utility } from '../../shared/utilities/util'
import { StorageService } from './storage.service'

@Injectable()
export class KafkaService {
  private KAFKA_CLIENT_URL: string
  private KAFKA_CLIENT_KAFKA: string = '/kafka'
  private specs = {}
  private cacheSending = false
  private MILLISECONDS = 1000

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
      this.KAFKA_CLIENT_URL = endPoint + this.KAFKA_CLIENT_KAFKA
    })
  }

  prepareKafkaObject(task: Task, data, questions) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const Answer: AnswerValueExport = {
      name: task.name,
      version: data.configVersion,
      answers: data.answers,
      time:
        questions[0].field_type == QuestionType.info // NOTE: Do not use info startTime
          ? data.answers[1].startTime
          : data.answers[0].startTime, // NOTE: whole questionnaire startTime and endTime
      timeCompleted: data.answers[data.answers.length - 1].endTime
    }

    this.util.getSourceKeyInfo().then(keyInfo => {
      const sourceId = keyInfo[0]
      const projectId = keyInfo[1]
      const patientId = keyInfo[2].toString()
      // NOTE: Payload for kafka 2 : key Object which contains device information
      const AnswerKey: AnswerKeyExport = {
        userId: patientId,
        sourceId: sourceId,
        projectId: projectId
      }
      const kafkaObject = { value: Answer, key: AnswerKey }
      this.getSpecs(task, kafkaObject).then(specs =>
        this.createPayload(specs, task, kafkaObject)
      )
    })
  }

  prepareNonReportedTasksKafkaObject(task: Task) {
    // NOTE: Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    const CompletionLog: CompletionLogValueExport = {
      name: task.name.toString(),
      time: task.timestamp / this.MILLISECONDS,
      completionPercentage: { double: task.completed ? 100 : 0 }
    }

    this.util.getSourceKeyInfo().then(keyInfo => {
      const sourceId = keyInfo[0]
      const projectId = keyInfo[1]
      const patientId = keyInfo[2].toString()
      const AnswerKey: AnswerKeyExport = {
        userId: patientId,
        sourceId: sourceId,
        projectId: projectId
      }
      const kafkaObject = { value: CompletionLog, key: AnswerKey }
      this.getSpecs(task, kafkaObject).then(specs =>
        this.createPayload(specs, task, kafkaObject)
      )
    })
  }

  getSpecs(task: Task, kafkaObject) {
    if (kafkaObject.value.completionPercentage !== undefined) {
      return Promise.resolve({
        name: 'completion_log',
        avsc: 'questionnaire',
        task: task,
        kafkaObject: kafkaObject
      })
    } else {
      return this.storage.getAssessmentAvsc(task).then(specs => {
        return Promise.resolve(
          Object.assign(specs, { task: task, kafkaObject: kafkaObject })
        )
      })
    }
  }

  createPayload(specs, task, kafkaObject) {
    return this.util
      .getLatestKafkaSchemaVersions(specs)
      .then(schemaVersions => {
        const avroKey = AvroSchema.parse(
          JSON.parse(schemaVersions[0]['schema']),
          {
            wrapUnions: true
          }
        )
        // NOTE: Issue forValue: inferred from input, due to error when parsing schema
        const avroVal = AvroSchema.Type.forValue(kafkaObject.value, {
          wrapUnions: true
        })
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
        return this.sendToKafka(
          specs,
          schemaId,
          schemaInfo,
          payload,
          task,
          kafkaObject
        )
      })
      .catch(error => {
        console.log(error)
        this.cacheAnswers(task, kafkaObject)
        return Promise.resolve({ res: 'ERROR' })
      })
  }

  sendToKafka(specs, id, info, payload, task, kafkaObject) {
    return this.getKafkaInstance().then(
      kafkaConnInstance => {
        // NOTE: Kafka connection instance to submit to topic
        const topic = specs.avsc + '_' + specs.name
        const cacheKey = kafkaObject.value.time
        console.log('Sending to: ' + topic)
        return kafkaConnInstance
          .topic(topic)
          .produce(id, info, payload, (err, res) => {
            if (err) {
              console.log(err)
              return this.cacheAnswers(task, kafkaObject)
            } else {
              return this.removeAnswersFromCache(cacheKey)
            }
          })
      },
      error => {
        console.error(
          'Could not initiate kafka connection ' + JSON.stringify(error)
        )
        return Promise.resolve({ res: 'ERROR' })
      }
    )
  }

  cacheAnswers(task: Task, kafkaObject) {
    this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      if (!cache[kafkaObject.value.time]) {
        console.log('KAFKA-SERVICE: Caching answers.')
        cache[kafkaObject.value.time] = {
          task: task,
          cache: kafkaObject
        }
        this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
      }
    })
  }

  sendAllAnswersInCache() {
    if (!this.cacheSending) {
      this.cacheSending = !this.cacheSending
      this.sendToKafkaFromCache()
        .then(() => (this.cacheSending = !this.cacheSending))
        .catch(e => console.log('Cache could not be sent.'))
    }
  }

  sendToKafkaFromCache() {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      if (!cache) {
        return this.storage.set(StorageKeys.CACHE_ANSWERS, {})
      } else {
        const promises = []
        let noOfTasks = 0
        for (const answerKey in cache) {
          if (answerKey) {
            promises.push(
              this.getSpecs(cache[answerKey].task, cache[answerKey].cache).then(
                specs => {
                  return this.createPayload(
                    specs,
                    specs.task,
                    specs.kafkaObject
                  )
                }
              )
            )
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
      }
    })
  }

  removeAnswersFromCache(cacheKey) {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      console.log('Deleting ' + cacheKey)
      delete cache[cacheKey]
      return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
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
