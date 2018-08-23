import { Injectable } from '@angular/core'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import { Http, Response } from '@angular/http'
import { StorageService } from './storage-service'
import { StorageKeys } from '../enums/storage'
import { AuthService } from './auth-service'
import { AnswerValueExport } from '../models/answer'
import { AnswerKeyExport } from '../models/answer'
import { CompletionLogValueExport } from '../models/answer'
import { Task } from '../models/task'
import { Utility } from  '../utilities/util'
import { DefaultEndPoint } from '../assets/data/defaultConfig'
import  KafkaClient from 'kafka-rest'
import AvroSchema from 'avsc'

@Injectable()
export class KafkaService {

  private KAFKA_CLIENT_URL: string
  private KAFKA_CLIENT_KAFKA: string = '/kafka'
  private specs = {}

  constructor(
    private http: Http,
    private util: Utility,
    public storage: StorageService,
    private authService: AuthService
  ) {
    this.KAFKA_CLIENT_URL = DefaultEndPoint + this.KAFKA_CLIENT_KAFKA
  }

  prepareKafkaObject(task: Task, data) {
    //Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    var Answer: AnswerValueExport = {
      "name": task.name,
      "version": data.configVersion,
      "answers": data.answers,
      "time": data.answers[0].startTime,  // whole questionnaire startTime and endTime
      "timeCompleted": data.answers[data.answers.length - 1].endTime
    }

    this.util.getSourceKeyInfo()
      .then((keyInfo) => {
        let sourceId = keyInfo[0]
        let projectId = keyInfo[1]
        let patientId = keyInfo[2].toString()
        //Payload for kafka 2 : key Object which contains device information
        var AnswerKey: AnswerKeyExport = { "userId": patientId, "sourceId": sourceId, "projectId": projectId }
        var kafkaObject = { "value": Answer, "key": AnswerKey }
        this.getSpecs(task, kafkaObject)
        .then((specs) => this.createPayload(specs, task, kafkaObject))
      })
  }

  prepareNonReportedTasksKafkaObject(task: Task) {
    //Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    var CompletionLog: CompletionLogValueExport = {
      "name": task.name.toString(),
      "time": task.timestamp,
      "completionPercentage": { double: task.completed ? 100 : 0}
    }

    this.util.getSourceKeyInfo()
      .then((keyInfo) => {
        let sourceId = keyInfo[0]
        let projectId = keyInfo[1]
        let patientId = keyInfo[2].toString()
        var AnswerKey: AnswerKeyExport = { "userId": patientId, "sourceId": sourceId, "projectId": projectId }
        var kafkaObject = { "value": CompletionLog, "key": AnswerKey }
        this.getSpecs(task, kafkaObject)
        .then((specs) => this.createPayload(specs, task, kafkaObject))
      })
  }

  getSpecs(task:Task, kafkaObject) {
    if(kafkaObject.value.completionPercentage != undefined) {
      return Promise.resolve({"name":"completion_log", "avsc":"questionnaire", "task":task, "kafkaObject":kafkaObject})
    } else {
      return this.storage.getAssessmentAvsc(task)
      .then((specs) => {
        return Promise.resolve(Object.assign(specs, {"task":task, "kafkaObject":kafkaObject}))
      })
    }
  }


  createPayload(specs, task, kafkaObject) {
    return this.util.getLatestKafkaSchemaVersions(specs)
    .then((schemaVersions) => {

      let avroKey = AvroSchema.parse(JSON.parse(schemaVersions[0]['schema']),  { wrapUnions: true })
      // ISSUE forValue: inferred from input, due to error when parsing schema
      let avroVal = AvroSchema.Type.forValue(kafkaObject.value, { wrapUnions: true })
      let bufferKey = avroKey.clone(kafkaObject.key,  { wrapUnions: true })
      let bufferVal = avroVal.clone(kafkaObject.value,  { wrapUnions: true })
      let payload = {
        key: bufferKey,
        value: bufferVal
      }

      let schemaId = new KafkaClient.AvroSchema(JSON.parse(schemaVersions[0]['schema']))
      let schemaInfo = new KafkaClient.AvroSchema(JSON.parse(schemaVersions[1]['schema']))
      //console.log("PAYLOAD")
      //console.log(schemaId)
      return this.sendToKafka(specs, schemaId, schemaInfo, payload, kafkaObject.value.time)
    })
    .catch((error) => {
      console.log(error)
      this.cacheAnswers(task, kafkaObject)
      return Promise.resolve({res: 'ERROR'})
    });

  }

  sendToKafka(specs, id, info, payload, cacheKey) {
    return this.getKafkaInstance().then(kafkaConnInstance => {
      // kafka connection instance to submit to topic
      var topic = specs.avsc + "_" + specs.name
      console.log("Sending to: " + topic)

      return kafkaConnInstance.topic(topic).produce(id, info, payload,
        (err, res) => {
          if (err) {
            console.log(err)
          } else {
            return this.removeAnswersFromCache(cacheKey)
          }
        })
    }, error => {
      console.error("Could not initiate kafka connection " + JSON.stringify(error))
      return Promise.resolve({res: 'ERROR'})
    })
  }

  cacheAnswers(task:Task, kafkaObject) {
    this.storage.get(StorageKeys.CACHE_ANSWERS)
    .then((cache) => {
      if(!cache[kafkaObject.value.time]){
        console.log('KAFKA-SERVICE: Caching answers.')
        cache[kafkaObject.value.time] = {
          'task': task,
          'cache': kafkaObject
        }
        this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
      }
    });
  }

  sendAllAnswersInCache(){
    return this.storage.get(StorageKeys.CACHE_ANSWERS)
    .then((cache) => {
      if(!cache){
        return this.storage.set(StorageKeys.CACHE_ANSWERS, {})
      } else {
        let promises = []
        let noOfTasks = 0
        for(var answerKey in cache) {
            promises.push(this.getSpecs(cache[answerKey].task, cache[answerKey].cache)
            .then((specs) => {
              return this.createPayload(specs, specs.task, specs.kafkaObject)
            }))
            noOfTasks += 1
            if(noOfTasks == 20) {
              break;
            }

        }
        return Promise.all(promises)
          .then((res) => {
            console.log(res)
            return Promise.resolve(res)
          })
      }
    });
  }

  removeAnswersFromCache(cacheKey){
    return this.storage.get(StorageKeys.CACHE_ANSWERS)
    .then((cache) => {
      console.log("Deleting " + cacheKey)
      delete cache[cacheKey]
      return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
    })
  }

  getKafkaInstance() {
    return this.authService.refresh()
    .then(() => this.storage.get(StorageKeys.OAUTH_TOKENS))
    .then((tokens) => {
      var headers = { 'Authorization': 'Bearer ' + tokens.access_token }
      return new KafkaClient({ 'url': this.KAFKA_CLIENT_URL, 'headers': headers })
    })
  }

  storeQuestionareData(values) {
    // TODO: Decide on whether to save Questionare data locally or send it to server

  }

}
