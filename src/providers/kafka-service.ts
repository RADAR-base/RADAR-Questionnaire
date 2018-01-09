import { Injectable } from '@angular/core'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import { Http, Response } from '@angular/http'
import { StorageService } from './storage-service'
import { StorageKeys } from '../enums/storage'
import { AuthService } from './auth-service'
import { AnswerValueExport } from '../models/answer'
import { AnswerKeyExport } from '../models/answer'
import { Utility } from  '../utilities/util'
import { DefaultEndPoint } from '../assets/data/defaultConfig'
import  KafkaClient from 'kafka-rest'
import AvroSchema from 'avsc'

@Injectable()
export class KafkaService {

  private KAFKA_CLIENT_URL: string
  private KAFKA_CLIENT_KAFKA: string = '/kafka'
  private TOPIC_NAME = 'questionnaire_'

  private questionnaireName: string
  private valueSchema: string
  private keySchema: string

  private schemaObjectKey: string
  private schemaObjectVal: string

  private schemaUrl = 'assets/data/schema/schemas.json'


  constructor(
    private http: Http,
    private util: Utility,
    private storage: StorageService,
    private authService: AuthService
  ) {
    this.KAFKA_CLIENT_URL = DefaultEndPoint + this.KAFKA_CLIENT_KAFKA
    this.sendAllAnswersInCache()
  }

  prepareKafkaObject(questionnaireName, data) {
    this.questionnaireName = questionnaireName.toLowerCase()
    this.schemaObjectKey = "questionnaire_" + this.questionnaireName + "-key"
    this.schemaObjectVal = "questionnaire_" + this.questionnaireName + "-value"
    //Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    var Answer: AnswerValueExport = {
      "name": questionnaireName,
      "version": data.configVersion,
      "answers": data.answers,
      "time": data.answers[0].startTime,  // whole questionnaire startTime and endTime
      "timeCompleted": data.answers[data.answers.length - 1].endTime
    }

    //Payload for kafka 2 : key Object which contains device information
    this.util.getSourceId()
    .then((sourceId) => {
      var AnswerKey: AnswerKeyExport = { "userId": data.patientId, "sourceId": sourceId }
      var kafkaObject = { "value": Answer, "key": AnswerKey }
      this.createPayload(kafkaObject)
    })
  }

  createPayload(kafkaObject) {
    return this.util.getLatestKafkaSchemaVersions(this.questionnaireName)
    .then(schemaVersions => {
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
      return this.sendToKafka(schemaId, schemaInfo, payload, kafkaObject.value.time)
    })
    .catch((error) => {
      this.cacheAnswers(kafkaObject)
    });

  }

  sendToKafka(id, info, payload, cacheKey) {
    return this.getKafkaInstance().then(kafkaConnInstance => {
      // kafka connection instance to submit to topic
      var topic = this.TOPIC_NAME + this.questionnaireName
      kafkaConnInstance.topic(topic).produce(id, info, payload,
        function(err, res) {
          if (res) {
            console.log(res)
            this.removeAnswersFromCache(cacheKey)
          } else if (err) {
            console.log(err)
          }
        })
    }, error => {
      console.error("Could not initiate kafka connection " + JSON.stringify(error))
    })
  }

  cacheAnswers(kafkaObject) {
    this.storage.get(StorageKeys.CACHE_ANSWERS)
    .then((cache) => {
      if(!cache[kafkaObject.value.time]){
        console.log('KAFKA-SERVICE: Caching answers.')
        cache[kafkaObject.value.time] = {
          'questionnaireName': this.questionnaireName,
          'cache': kafkaObject
        }
        this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
      }
    });
  }

  sendAllAnswersInCache(){
    this.storage.get(StorageKeys.CACHE_ANSWERS)
    .then((cache) => {
      if(!cache){
        this.storage.set(StorageKeys.CACHE_ANSWERS, {})
      } else {
        for(var answerKey in cache) {
          this.questionnaireName = cache[answerKey].questionnaireName
          this.createPayload(cache[answerKey].cache)
        }
      }
      console.log(cache)
    });
  }

  removeAnswersFromCache(cacheKey){
    this.storage.get(StorageKeys.CACHE_ANSWERS)
    .then((cache) => {
      delete cache[cacheKey]
      this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
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
