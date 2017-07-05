import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { AnswerService } from '../../providers/answer-service'
import { HomePage } from '../home/home'

import { KafkaService }  from '../../providers/kafka-service'
import { StorageService } from '../../providers/storage-service'
import { StorageKeys } from '../../enums/storage'
import { Utility } from  '../../utilities/util'

import { AnswerValueExport } from '../../models/answer'
import { AnswerKeyExport } from '../../models/answer'


@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {

  content: string = ""
  private configVersion: number = 0.1
  private patientId: string = "1" // dummy value


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private answerService: AnswerService,
    private kafkaService: KafkaService,
    private storage: StorageService,
    private util: Utility,
    private controller: HomeController,
  ) {

  }

  ionViewDidLoad () {
    console.log(this.answerService.answers)
    this.content = this.navParams.data.endText

    // Before submitting data to kafka, fetch config version and Patient ID
    this.fetchFromStorage().then(resp => {

      // response values are in the same order as the promises provided
      this.configVersion = resp[0]
      this.patientId = resp[1]

      // process answers and submit to kafka
      this.processQuestionnaireAnswers(this.answerService.answers)

    }, error => {
      console.log(JSON.stringify(error))
    })

  }

  // fetch patientID and config version from local storage
  // include other items when required
  // the values in response are in the same order as the promises
  // local storage service get() returns a promise always
  fetchFromStorage() {

    const configVersion = this.storage.get(StorageKeys.CONFIG_VERSION)
    const patientID = this.storage.get(StorageKeys.PATIENTID)

    return Promise.all([configVersion, patientID])
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
      "version": this.configVersion,
      "answers": answers,
      "startTime": 12.02,  // whole questionnaire startTime and endTime
      "endTime": 12.05
    }

    //Payload for kafka : key Object which contains device information
    var deviceInfo = this.util.getDevice()

    if (deviceInfo.isDeviceReady == true) {
      var AnswerKey: AnswerKeyExport = { "userId": this.patientId, "sourceId": deviceInfo.device.uuid }
    } else {
      var AnswerKey: AnswerKeyExport = { "userId": this.patientId, "sourceId": "Device not known" }
    }

    var answerData = { "value": Answer, "key": AnswerKey }

    this.sendToKafka(answerData)

  }

  sendToKafka(QuestionnaireData) {
    this.kafkaService.build(QuestionnaireData)  //submit data to kafka
  }


  handleClosePage() {
    this.controller.updateTaskToComplete(this.navParams.data.associatedTask).then(() => {
    this.navCtrl.setRoot(HomePage)
    })
  }
}
