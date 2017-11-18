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
    console.log(Answer)

    //Payload for kafka 2 : key Object which contains device information
    this.util.getSourceId()
    .then((sourceId) => {
      console.log(data.patientId)
      console.log(sourceId)

      var AnswerKey: AnswerKeyExport = { "userId": data.patientId, "sourceId": sourceId }

      var kafkaObject = { "value": Answer, "key": AnswerKey }

      //this.prepareExportSchema(kafkaObject)
      this.createPayload(kafkaObject)
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
    this.util.getLatestKafkaSchemaVersions(this.questionnaireName)
    .then(schemaVersions => {
      var payload = {}
      console.log(schemaVersions)
      payload['key_schema_id'] = schemaVersions[0]['id']
      payload['value_schema_id'] = schemaVersions[1]['id']
      //var armt_exportKeySchema = avro.parse(schema[this.schemaObjectKey], { wrapUnions: true })
      //var armt_exportValueSchema = AvroSchema.parse(schema[this.schemaObjectVal], { wrapUnions: true })
      // wraps all strings and ints to their type
      //var key = armt_exportKeySchema.clone(kafkaData.key, { wrapUnions: true })
      //var value = armt_exportValueSchema.clone(kafkaData.value, { wrapUnions: true });
      //payload['records'] = [{
      //  "key": key,
      //  "value": value
    //  }]

      //this.sendToKafka(payload)
    });
  }

  createPayload(kafkaObject) {
    this.util.getLatestKafkaSchemaVersions(this.questionnaireName)
    .then(schemaVersions => {
      /*var payload = {}

      let avroKey = AvroSchema.Type.forSchema(JSON.parse(schemaVersions[0]['schema']))
      // ISSUE forValue: inferred from input, due to error when parsing schema
      let avroVal = AvroSchema.Type.forValue(kafkaObject.value)
      let bufferKey = avroKey.toBuffer(kafkaObject.key)
      let bufferVal = avroVal.toBuffer(kafkaObject.value)

      payload['key_schema_id'] = schemaVersions[0]['id']
      payload['value_schema_id'] = schemaVersions[1]['id']
      payload['records'] = [{ 'key': bufferKey, 'value': bufferVal }]

      this.sendToKafka(payload)*/
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
      console.log(schemaId)
      console.log(payload.key)
      console.log(schemaInfo)
      console.log(payload.value)
      this.sendToKafka(schemaId, schemaInfo, payload)
    });

  }

  sendToKafka(id, info, payload) {
    this.getKafkaInstance().then(kafkaConnInstance => {
      // kafka connection instance to submit to topic
      var topic = this.TOPIC_NAME + this.questionnaireName
      kafkaConnInstance.topic(topic).produce(id, info, payload,
        function(err, res) {
          if (res) {
            console.log(res)
          } else if (err) {
            console.log(err)
          }
        })
    }, error => {
      console.error("Could not initiate kafka connection " + JSON.stringify(error))
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
