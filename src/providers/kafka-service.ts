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

  private aRMT_ID_Schema: string
  private aRMT_Value_Schema: string
  private phq8Schema: string

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

    var armt_exportSchema = AvroSchema.parse(this.phq8Schema, { wrapUnions: true })
    var finalData = armt_exportSchema.clone(data, { wrapUnions: true });  //wraps all strings and ints to there type

    this.send_toKafka(schema, finalData)
  }

  prepareExportSchema(data) {

    this.util.getSchema(this.schemaUrl).subscribe(
      resp => {
        this.phq8Schema = resp.schemas[0].active_questionnaire_phq8_Schema
        // Avroschema object from kafkaClient
        this.aRMT_ID_Schema = new KafkaClient.AvroSchema({ "type": 'int' }) // TODO: include schema id type in config data
        this.aRMT_Value_Schema = new KafkaClient.AvroSchema(this.phq8Schema)

        var schemaObject = {
          "ID_Schema": this.aRMT_ID_Schema,
          "Value_Schema": this.aRMT_Value_Schema
        }
        this.validateData(schemaObject, data)
      }, error => {
        console.log("Error at" + error)
      })
  }


  send_toKafka(schema, questionnaireData) {

    this.getKafkaInstance().then(kafkaConnInstance => {

      // use kafka connection instance to submit to topic
      kafkaConnInstance.topic(this.TOPIC_NAME).produce(schema.ID_Schema, schema.Value_Schema,
        {
          'key': 1, 'value': questionnaireData
        },
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
