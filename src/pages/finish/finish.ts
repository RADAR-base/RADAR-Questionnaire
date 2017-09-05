import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { HomePage } from '../home/home'
import { AnswerService } from '../../providers/answer-service'
import { KafkaService } from '../../providers/kafka-service'
import { TimeStampService } from '../../providers/timestamp-service'
import { PrepareDataService } from '../../providers/preparedata-service'


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
    private timestampService: TimeStampService,
    private prepareDataService: PrepareDataService,
    private controller: HomeController
  ) {

  }

  ionViewDidLoad() {

    this.content = this.navParams.data.endText

    console.log(this.answerService.answers)
    console.log(this.timestampService.timestamps)


    this.prepareDataService.process_QuestionnaireData(this.answerService.answers,
      this.timestampService.timestamps)
      .then(data => {
        this.sendToKafka(data)
      }, error => {
        console.log(JSON.stringify(error))
      })

  }

  sendToKafka(QuestionnaireData) {
    this.kafkaService.prepare_KafkaObject(QuestionnaireData)  //submit data to kafka
  }


  handleClosePage() {
    this.controller.updateTaskToComplete(this.navParams.data.associatedTask).then(() => {
      this.navCtrl.setRoot(HomePage)
    })
  }
}
