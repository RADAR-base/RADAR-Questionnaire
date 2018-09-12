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
import { DefaultNumberOfNotificationsToSchedule } from '../../assets/data/defaultConfig'


@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {

  content: string = ""
  isClinicalTask: boolean = false
  completedInClinic: boolean = false
  displayNextTaskReminder: boolean = true
  hasClickedDoneButton: boolean = false

  constructor (
    public navCtrl: NavController,
    public navParams: NavParams,
    private answerService: AnswerService,
    private kafkaService: KafkaService,
    private timestampService: TimeStampService,
    private prepareDataService: PrepareDataService,
    private controller: HomeController,
    public storage: StorageService
  ) {}

  ionViewDidLoad () {
    this.content = this.navParams.data.endText
    const questionnaireName: string = this.navParams.data.associatedTask.name
    if (!questionnaireName.includes('DEMO')) {
      try {
        if (this.navParams.data['associatedTask']['protocol']['clinicalProtocol']) {
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
    } else {
      // This is a Demo Questionnaire. Just update to complete and do nothing else
      this.controller.updateTaskToComplete(this.navParams.data.associatedTask)
    }

    this.controller.getNextTask()
      .then((task) => {
        if (task) {
          if (task.name !== 'ESM') {
            this.displayNextTaskReminder = true
          }
        } else {
          this.displayNextTaskReminder = false
        }
      })
  }

  sendToKafka (questionnaireName, questionnaireData) {
    this.kafkaService.prepareKafkaObject(questionnaireName, questionnaireData)  // submit data to kafka
  }


  handleClosePage() {
    this.hasClickedDoneButton = !this.hasClickedDoneButton
    this.evalClinicalFollowUpTask()
    .then(() => {
      this.kafkaService.sendAllAnswersInCache()
      this.navCtrl.setRoot(HomePage)
    });
  }

  evalClinicalFollowUpTask() {
    if(this.completedInClinic) {
      return this.storage.get(StorageKeys.SCHEDULE_TASKS_CLINICAL)
      .then((tasks) => this.generateClinicalTasks(tasks))
    } else {
      return Promise.resolve({})
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
    return this.storage.set(StorageKeys.SCHEDULE_TASKS_CLINICAL, clinicalTasks)
      .then(() => {return this.controller.setNextXNotifications(DefaultNumberOfNotificationsToSchedule)})
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
