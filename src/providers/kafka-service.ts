import { Injectable } from '@angular/core'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import { Http, Response } from '@angular/http'

import { Utility } from  '../utilities/util'
import KafkaClient  from 'kafka-rest'
import AvroSchema   from 'avsc'

@Injectable()
export class KafkaService {

  private TOPIC_NAME = "active_questionnaire_phq8"  //kafka topic where data has to be submitted


  private phq8ValueSchema: string
  private phq8KeySchema: string

  private schemaUrl = 'assets/data/schema/schemas.json'
  private configUrl = 'assets/data/config/config.json'

  constructor(
    private http: Http,
    private util: Utility
  ) {
  }

  getKafkaInstance(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve(this.getKafkaConnection())
    })
  }

  build(QuestionnaireData) {
    this.prepareExportSchema(QuestionnaireData)
  }

  storeQuestionareData(values) {
    // TODO: Decide on whether to save Questionare data locally or send it to server

  }


  validateData(schema, data) {

    var armt_exportValueSchema = AvroSchema.parse(this.phq8ValueSchema, { wrapUnions: true })
    var armt_exportKeySchema = AvroSchema.parse(this.phq8KeySchema, { wrapUnions: true })

    // wraps all strings and ints to there type
    var key = armt_exportKeySchema.clone(data.key, { wrapUnions: true })
    var value = armt_exportValueSchema.clone(data.value, { wrapUnions: true });

    var payload = {
      "key": key,
      "value": value
    }

    this.send_toKafka(schema, payload)
  }

  prepareExportSchema(data) {

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
        this.validateData(schemaObject, data)

      }, error => {
        console.log("Error at" + error)
      })
  }



  send_toKafka(schema, questionnaireData) {

    this.getKafkaInstance().then(kafkaConnInstance => {

      // use kafka connection instance to submit to topic
      kafkaConnInstance.topic(this.TOPIC_NAME).produce(schema.ID_Schema, schema.Value_Schema, questionnaireData,
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

  getKafkaConnection() {
    var kafka = new KafkaClient({ 'url': 'https://radararmt.ddns.net/kafka' })
    return kafka
  }

}
