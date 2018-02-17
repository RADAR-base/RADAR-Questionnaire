import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { HomePage } from '../home/home'
import { AnswerService } from '../../providers/answer-service'
import { KafkaService }  from '../../providers/kafka-service'
import { TimeStampService } from '../../providers/timestamp-service'
import { PrepareDataService} from '../../providers/preparedata-service'


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
    let questionnaireName: string = this.navParams.data.associatedTask.name
    this.prepareDataService.process_QuestionnaireData(this.answerService.answers,
      this.timestampService.timestamps)
      .then(data => {
        this.controller.updateTaskToComplete(this.navParams.data.associatedTask)
        this.sendToKafka(questionnaireName, data)
      }, error => {
        console.log(JSON.stringify(error))
      })

  }

  sendToKafka(questionnaireName, questionnaireData) {
    this.kafkaService.prepareKafkaObject(questionnaireName, questionnaireData)  //submit data to kafka
  }


  handleClosePage() {
    this.navCtrl.setRoot(HomePage)
  }
}
