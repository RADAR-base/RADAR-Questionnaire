import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { AnswerService } from '../../providers/answer-service'
import { HomePage } from '../home/home'

import { KafkaService }  from '../../providers/kafka-service'
import { Utility } from  '../../utilities/util'

import { AnswerValueExport } from '../../models/answer'
import { AnswerKeyExport } from '../../models/answer'


@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {

  content: string = ""

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private answerService: AnswerService,
    private kafkaService: KafkaService,
    private util: Utility
  ) {

  }

  ionViewDidLoad() {
    // TODO: Send data to server
    console.log(this.answerService.answers)
    this.processQuestionnaireAnswers(this.answerService.answers)

    // resolve observable with async properly
    this.content = this.navParams.data.endText
  }

  sendToKafka(QuestionnaireData) {
    this.kafkaService.build(QuestionnaireData)  //submit data to kafka
  }

  processQuestionnaireAnswers(values) {

    var keys = Object.keys(values)
    var keylength = keys.length

    var answersProcessedCount = 0;
    var answers = []

    for (var key in values) {
      answersProcessedCount++
      var answer = {
        value: values[key],
        startTime: 1,
        endTime: 2
      }
      answers.push(answer)
      if (answersProcessedCount == keylength) {

        this.createAnswerObject(answers)


      }
    }
  }

  createAnswerObject(answers) {

    //Payload for kafka : value Object which contains individual questionnaire response
    var Answer: AnswerValueExport = {
      "type": "PHQ8",
      "version": 2,           // TODO:fetch version from config.json or local storage
      "answers": answers,
      "startTime": 12.02,
      "endTime": 12.05
    }

    //Payload for kafka : key Object which contains device information
    var deviceInfo = this.util.getDevice()

    if (deviceInfo.isDeviceReady == true) {
      var AnswerKey: AnswerKeyExport = { "userId": "user01", "sourceId": deviceInfo.device.uuid }
    } else {
      var AnswerKey: AnswerKeyExport = { "userId": "user01", "sourceId": "Device not known" }
    }

    var answerData = { "value": Answer, "key": AnswerKey }

    this.sendToKafka(answerData)
  }


  handleClosePage() {
    this.navCtrl.setRoot(HomePage)
  }

}
