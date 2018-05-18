import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { HomePage } from '../home/home'
import { AnswerService } from '../../providers/answer-service'
import { KafkaService }  from '../../providers/kafka-service'
import { TimeStampService } from '../../providers/timestamp-service'
import { PrepareDataService} from '../../providers/preparedata-service'
import { StorageService } from '../../providers/storage-service'
import { StorageKeys } from '../../enums/storage'
import { Task } from '../../models/task'
import { Reminders } from '../../models/protocol'


@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {

  content: string = ""
  isClinicalTask: boolean = false
  completedInClinic: boolean = false
  displayNextTaskReminder: boolean = true

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private answerService: AnswerService,
    private kafkaService: KafkaService,
    private timestampService: TimeStampService,
    private prepareDataService: PrepareDataService,
    private controller: HomeController,
    private storage: StorageService
  ) {}

  ionViewDidLoad() {
    this.content = this.navParams.data.endText
    let questionnaireName: string = this.navParams.data.associatedTask.name
    try {
      if(this.navParams.data['associatedTask']['protocol']['clinicalProtocol']) {
        this.isClinicalTask = true
      }
    } catch (TypeError) {
      console.log('INFO: Not in clinic task/questionnaire.')
    }
    this.prepareDataService.process_QuestionnaireData(this.answerService.answers,
      this.timestampService.timestamps)
      .then(data => {
        this.controller.updateTaskToComplete(this.navParams.data.associatedTask)
        this.sendToKafka(this.navParams.data.associatedTask, data)
      }, error => {
        console.log(JSON.stringify(error))
      })
    this.controller.getNextTask()
      .then((task) => {
        if(task) {
          this.displayNextTaskReminder = true
        } else {
          this.displayNextTaskReminder = false
        }
      })
  }

  sendToKafka(questionnaireName, questionnaireData) {
    this.kafkaService.prepareKafkaObject(questionnaireName, questionnaireData)  //submit data to kafka
  }


  handleClosePage() {
    this.evalClinicalFollowUpTask()
    this.navCtrl.setRoot(HomePage)
  }

  evalClinicalFollowUpTask() {
    if(this.completedInClinic) {
      this.storage.get(StorageKeys.SCHEDULE_TASKS_CLINICAL)
      .then((tasks) => this.generateClinicalTasks(tasks))
    }
  }

  generateClinicalTasks(tasks) {
    let clinicalTasks = []
    if(tasks) {
      clinicalTasks = tasks
    } else {
      tasks = []
    }
    let associatedTask = this.navParams.data['associatedTask']
    let protocol = this.navParams.data['associatedTask']['protocol']
    let repeatTimes = this.formatRepeatsAfterClinic(protocol['clinicalProtocol']['repeatAfterClinicVisit'])
    let now = new Date()
    for(var i = 0; i < repeatTimes.length; i++) {
      let ts = now.getTime() + repeatTimes[i]
      console.log(tasks.length + i)
      let clinicalTask: Task = {
        index: tasks.length + i,
        completed: false,
        reportedCompletion: false,
        timestamp: ts,
        name: associatedTask['name'],
        reminderSettings: protocol['reminders'],
        nQuestions: associatedTask['questions'].length,
        estimatedCompletionTime: associatedTask['estimatedCompletionTime'],
        warning: '',
        isClinical: true
      }
      clinicalTasks.push(clinicalTask)
    }
    this.storage.set(StorageKeys.SCHEDULE_TASKS_CLINICAL, clinicalTasks)
      .then(() => this.controller.setNextXNotifications(40))
  }

  formatRepeatsAfterClinic (repeats) {
    let repeatsInMillis = []
    let unit = repeats['unit']
    for(var i = 0; i < repeats['unitsFromZero'].length; i++) {
      let unitFromZero = repeats['unitsFromZero'][i]
      switch(unit){
        case 'min': {
          let formatted = unitFromZero * 1000 * 60
          repeatsInMillis.push(formatted)
          break;
        }
        case 'hour': {
          let formatted = unitFromZero * 1000 * 60 * 60
          repeatsInMillis.push(formatted)
          break;
        }
        case 'day': {
          let formatted = unitFromZero * 1000 * 60 * 60 * 24
          repeatsInMillis.push(formatted)
          break;
        }
      }
    }
    return repeatsInMillis
  }
}
