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
  private TOPIC_NAME = 'active_questionnaire_phq8'

  private phq8ValueSchema: string
  private phq8KeySchema: string

  private schemaUrl = 'assets/data/schema/schemas.json'


  constructor(
    private http: Http,
    private util: Utility,
    private storage: StorageService,
    private AuthService: AuthService
  ) {
    this.KAFKA_CLIENT_URL = DefaultEndPoint + this.KAFKA_CLIENT_KAFKA
  }

  prepareKafkaObject(questionnaireName, data) {

    //Payload for kafka 1 : value Object which contains individual questionnaire response with timestamps
    var Answer: AnswerValueExport = {
      "type": questionnaireName,
      "version": data.configVersion,
      "answers": data.answers,
      "startTime": data.answers[0].startTime,  // whole questionnaire startTime and endTime
      "endTime": data.answers[data.answers.length - 1].endTime
    }

    //Payload for kafka 2 : key Object which contains device information
    var deviceInfo = this.util.getDevice()

    if (deviceInfo.isDeviceReady == true) {
      var AnswerKey: AnswerKeyExport = { "userId": data.patientId, "sourceId": deviceInfo.device.uuid }
    } else {
      var AnswerKey: AnswerKeyExport = { "userId": data.patientId, "sourceId": "Device not known" }
    }

    var kafkaObject = { "value": Answer, "key": AnswerKey }

    this.prepareExportSchema(kafkaObject)
  }


  prepareExportSchema(dataObject) {

    this.util.getSchema(this.schemaUrl).subscribe(
      resp => {
        this.phq8ValueSchema = resp.schemas[0].aRMT_phq8_Export_ValueSchema
        this.phq8KeySchema = resp.schemas[0].aRMT_phq8_Export_KeySchema

        // Avroschema object from kafkaClient
        var aRMT_Key_Schema = new KafkaClient.AvroSchema(this.phq8KeySchema)
        var aRMT_Value_Schema = new KafkaClient.AvroSchema(this.phq8ValueSchema)

        var schemaObject = {
          "ID_Schema": aRMT_Key_Schema,
          "Value_Schema": aRMT_Value_Schema
        }
        this.validateData(schemaObject, dataObject)

      }, error => {
        console.log("Error at" + JSON.stringify(error))
      })
  }

  validateData(schema, kafkaData) {

    var armt_exportValueSchema = AvroSchema.parse(this.phq8ValueSchema, { wrapUnions: true })
    var armt_exportKeySchema = AvroSchema.parse(this.phq8KeySchema, { wrapUnions: true })

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

    this.getKafkaInstance().then(kafkaConnInstance => {

      // kafka connection instance to submit to topic
      kafkaConnInstance.topic(this.TOPIC_NAME).produce(schema.ID_Schema, schema.Value_Schema,
        questionnaireData,
        function(err, res) {
          if (res) {
            console.log(res)
          } else if (err) {
            console.log(err)
          }
        });
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
    return this.AuthService.refresh('')
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
