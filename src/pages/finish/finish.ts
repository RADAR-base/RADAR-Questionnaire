import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { AnswerService } from '../../providers/answer-service'
import * as KafkaRest from 'kafka-rest/lib/client'

const Kafka = new KafkaRest({ 'url': 'http://192.168.42.104:8082' })

@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {

  private aRMTIdSchema: string
  private aRMTInfoSchema: string

  constructor (
    public navCtrl: NavController,
    private answerService: AnswerService
  ) {
    this.aRMTIdSchema = new KafkaRest.AvroSchema({ 'type': 'int' })
    this.aRMTInfoSchema = new KafkaRest.AvroSchema({
      'namespace': 'org.radarcns.questionnaire',
      'type': 'record',
      'name': 'Phq',
      'doc': 'Phq questionnaire',
      'fields': [{
        'name': 'questionnaireId',
        'type': 'int',
        'doc': 'Questionnaire identifier'
      },
      {
        'name': 'answers',
        'type': {
          'name': 'Answer',
          'type': 'record',
          'doc': 'Questionnaire answer',
          'fields': [{
            'name': 'value',
            'type': { 'type': 'map', 'values': 'int' },
            'doc': 'Subject answer'
          },
          {
            'name': 'startTime',
            'type': 'double',
            'doc': 'timestamp in UTC (s) when the question is shown'
          },
          {
            'name': 'endTime',
            'type': 'double',
            'doc': 'timestamp in UTC (s)  when the question is answered'
          }
          ]
        },
        'doc': 'Answers List'
      },
      {
        'name': 'StartTime',
        'type': 'double',
        'doc': 'timestamp in UTC (s) when the questionnaire is submitted to the subject'
      },
      {
        'name': 'EndTime',
        'type': 'double',
        'doc': 'timestamp in UTC (s) when the questionnaire is sent out to the platform'
      }
      ]
    })
  }

  ionViewDidLoad () {
    // TODO: Send data to server
    console.log(this.answerService.answers)

    Kafka.topic('aRMT1').produce(this.aRMTIdSchema, this.aRMTInfoSchema,
      {
        'key': 1, 'value': {
          'questionnaireId': 1,
          'answers': {
            'value': this.answerService.answers,
            'startTime': 12335.0,
            'endTime': 12336.0
          },
          'StartTime': 12335.0,
          'EndTime': 12336.0
        }
      },

      function (err, res) {
        if (err) {
          console.log(err)
        } else if (res) {
          console.log(res)
        }
      })

  }

  handleClosePage () {
    this.navCtrl.pop()
  }

}
