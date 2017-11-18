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
import KafkaClient  from 'kafka-rest'
import AvroSchema   from 'avsc'

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
  }

  prepareKafkaObject(questionnaireName, data) {

    this.questionnaireName = questionnaireName.toLowerCase()
    //Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    var Answer: AnswerValueExport = {
      "name": questionnaireName,
      "version": data.configVersion,
      "answers": data.answers,
      "time": data.answers[0].startTime,  // whole questionnaire startTime and endTime
      "timeCompleted": data.answers[data.answers.length - 1].endTime
    }
    console.log(Answer)

    //Payload for kafka 2 : key Object which contains device information
    this.util.getSourceId()
    .then((sourceId) => {
      console.log(data.patientId)
      console.log(sourceId)

      var AnswerKey: AnswerKeyExport = { "userId": data.patientId, "sourceId": sourceId }

      var kafkaObject = { "value": Answer, "key": AnswerKey }

      this.prepareExportSchema(kafkaObject)
    })
  }


  prepareExportSchema(dataObject) {

    this.util.getSchema(this.schemaUrl).subscribe(
      resp => {
        this.keySchema = resp.schemas[0].questionnaire_key
        this.valueSchema = resp.schemas[0].questionnaire_value

        // Avroschema object from kafkaClient
        var aRMT_Key_Schema = new KafkaClient.AvroSchema(this.keySchema)
        var aRMT_Value_Schema = new KafkaClient.AvroSchema(this.valueSchema)

        this.schemaObjectKey = "questionnaire_" + this.questionnaireName + "-key"
        this.schemaObjectVal = "questionnaire_" + this.questionnaireName + "-value"

        var schemaObject = {}
        schemaObject[this.schemaObjectKey] = aRMT_Key_Schema
        schemaObject[this.schemaObjectVal] = aRMT_Value_Schema
        console.log(schemaObject)
        this.validateData(schemaObject, dataObject)

      }, error => {
        console.log("Error at" + JSON.stringify(error))
      })
  }

  validateData(schema, kafkaData) {
    var armt_exportKeySchema = AvroSchema.parse(this.keySchema, { wrapUnions: true })
    var armt_exportValueSchema = AvroSchema.parse(this.valueSchema, { wrapUnions: true })
    // wraps all strings and ints to their type
    var key = armt_exportKeySchema.clone(kafkaData.key, { wrapUnions: true })
    var value = armt_exportValueSchema.clone(kafkaData.value, { wrapUnions: true });
    var payload = {
      "key": key,
      "value": value
    }

    this.sendToKafka(schema, payload)
  }

  sendToKafka(schema, questionnaireData) {
    console.log(schema)

    this.getKafkaInstance().then(kafkaConnInstance => {

      this.util.getLatestKafkaSchemaVersions(this.questionnaireName)
      .then(schemaVersions => {
        console.log(schemaVersions)
        // kafka connection instance to submit to topic
        var topic = this.TOPIC_NAME + this.questionnaireName
        kafkaConnInstance.topic(topic).produce(
          questionnaireData,
          function(err, res) {
            if (res) {
              console.log(res)
            } else if (err) {
              console.log(err)
            }
          });
      })

    }, error => {
      console.error("Could not initiate kafka connection " + JSON.stringify(error))
    })
  }

  getKafkaInstance(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve(this.getKafkaConnection())
    })
  }

  getKafkaConnection() {
    return this.authService.refresh()
    .then(() => this.storage.get(StorageKeys.OAUTH_TOKENS))
    .then((tokens) => {
      var headers = {
        'Authorization': 'Bearer ' + tokens.access_token
      }
      var kafka = new KafkaClient({ 'url': this.KAFKA_CLIENT_URL, 'headers': headers })
      return kafka
    })
  }

  storeQuestionareData(values) {
    // TODO: Decide on whether to save Questionare data locally or send it to server

  }

}
