import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { AnswerService } from '../../providers/answer-service'
import { HomePage } from '../home/home'
import { KafkaService }  from '../../providers/kafka-service'
import { AnswerExport } from '../../models/answer'

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
    private kafkaService: KafkaService
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
        var AnswerObject: AnswerExport = {
          "type": "PHQ8",
          "version": 1,           // TODO:fetch version from config.json or local storage
          "answers": answers,
          "startTime": 12.02,
          "endTime": 12.05
        }
        this.sendToKafka(AnswerObject)
      }
    }
  }

  handleClosePage() {
    this.navCtrl.setRoot(HomePage)
  }

}
