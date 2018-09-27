import { Component, ElementRef, ViewChild } from '@angular/core'
import {
  AlertController,
  Content,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular'

import { DefaultTask } from '../../assets/data/defaultConfig'
import { LocKeys } from '../../enums/localisations'
import { StorageKeys } from '../../enums/storage'
import { Task, TasksProgress } from '../../models/task'
import { TranslatePipe } from '../../pipes/translate/translate'
import { HomeController } from '../../providers/home-controller'
import { KafkaService } from '../../providers/kafka-service'
import { NotificationService } from '../../providers/notification-service'
import { SchedulingService } from '../../providers/scheduling-service'
import { StorageService } from '../../providers/storage-service'
import { checkTaskIsNow } from '../../utilities/check-task-is-now'
import { ClinicalTasksPage } from '../clinical-tasks/clinical-tasks'
import { QuestionsPage } from '../questions/questions'
import { SettingsPage } from '../settings/settings'
import { SplashPage } from '../splash/splash'
import { StartPage } from '../start/start'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('content')
  elContent: Content
  elContentHeight: number
  @ViewChild('progressBar')
  elProgress: ElementRef
  elProgressHeight: number
  @ViewChild('tickerBar')
  elTicker: ElementRef
  elTickerHeight: number
  @ViewChild('taskInfo')
  elInfo: ElementRef
  elInfoHeight: number
  @ViewChild('footer')
  elFooter: ElementRef
  elFooterHeight: number
  @ViewChild('taskCalendar')
  elCalendar: ElementRef

  isOpenPageClicked: boolean = false
  nextTask: Task = DefaultTask
  showCalendar: boolean = false
  showCompleted: boolean = false
  showNoTasksToday: boolean = false
  tasksProgress: TasksProgress
  calendarScrollHeight: number = 0
  hasClickedStartButton: boolean = true
  hasClinicalTasks = false
  hasOnlyESMs = false
  taskIsNow = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private schedule: SchedulingService,
    private controller: HomeController,
    private translate: TranslatePipe,
    public storage: StorageService,
    private notification: NotificationService,
    private platform: Platform,
    private kafka: KafkaService
  ) {}

  ionViewWillEnter() {
    this.getElementsAttributes()
    this.elProgressHeight += 15
    this.applyTransformations()
  }

  ionViewDidLoad() {
    // const isFirstIonDidViewLoad = this.navParams.data.isFirstIonDidViewLoad
    this.checkForNextTask()
    this.evalHasClinicalTasks()
    this.checkIfOnlyESM()

    setInterval(() => {
      // this.isNextTaskESMandNotNow()
      this.checkForNextTask()
    }, 1000)

    this.platform.resume.subscribe(e => {
      this.kafka.sendAllAnswersInCache()
    })

    this.controller.sendNonReportedTaskCompletion()
  }

  checkForNextTask() {
    if (!this.showCalendar) {
      this.controller.getNextTask().then(task => {
        this.checkForNextTaskGeneric(task)
      })
    }
  }

  checkForNextTaskGeneric(task) {
    if (task) {
      this.nextTask = task
      this.hasClickedStartButton = false
      this.displayCompleted(false)
      this.displayEvalTransformations(false)
      this.taskIsNow = checkTaskIsNow(task.timestamp)
    } else {
      this.controller.areAllTasksComplete().then(completed => {
        if (completed) {
          this.nextTask = DefaultTask
          this.displayCompleted(true)
          if (!this.tasksProgress) {
            this.showNoTasksToday = true
          }
        } else {
          this.nextTask = DefaultTask
          this.displayEvalTransformations(true)
        }
      })
    }
  }

  checkIfOnlyESM() {
    this.controller.getTasksOfToday().then(tasks => {
      let tmpHasOnlyESMs = true
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].name !== 'ESM') {
          tmpHasOnlyESMs = false
          break
        }
      }
      this.hasOnlyESMs = tmpHasOnlyESMs
    })
  }

  evalHasClinicalTasks() {
    this.storage.get(StorageKeys.HAS_CLINICAL_TASKS).then(isClinical => {
      this.hasClinicalTasks = isClinical
    })
  }

  displayEvalTransformations(requestDisplay: boolean) {
    this.showCalendar = requestDisplay
    this.getElementsAttributes()
    this.applyTransformations()
  }

  displayCompleted(requestDisplay: boolean) {
    this.showCompleted = requestDisplay
    this.getElementsAttributes()
    this.applyCompletedTransformations()
  }

  getElementsAttributes() {
    this.elContentHeight = this.elContent.contentHeight
    // console.log(this.elContent)
    this.elProgressHeight = this.elProgress.nativeElement.offsetHeight - 15
    // console.log(this.elProgress)
    this.elTickerHeight = this.elTicker.nativeElement.offsetHeight
    // console.log(this.elTicker)
    this.elInfoHeight = this.elInfo.nativeElement.offsetHeight
    // console.log(this.elInfo)
    this.elFooterHeight = this.elFooter.nativeElement.offsetHeight
    // console.log(this.elFooter)
  }

  applyTransformations() {
    if (this.showCalendar) {
      this.elProgress.nativeElement.style.transform = `translateY(-${
        this.elProgressHeight
      }px) scale(1)`
      this.elTicker.nativeElement.style.transform = `translateY(-${
        this.elProgressHeight
      }px)`
      this.elInfo.nativeElement.style.transform = `translateY(-${
        this.elProgressHeight
      }px)`
      this.elFooter.nativeElement.style.transform = `translateY(${
        this.elFooterHeight
      }px) scale(0)`
      this.elCalendar.nativeElement.style.transform = `translateY(-${
        this.elProgressHeight
      }px)`
      this.elCalendar.nativeElement.style.opacity = 1
    } else {
      this.elProgress.nativeElement.style.transform = 'translateY(0px) scale(1)'
      this.elTicker.nativeElement.style.transform = 'translateY(0px)'
      this.elInfo.nativeElement.style.transform = 'translateY(0px)'
      this.elFooter.nativeElement.style.transform = 'translateY(0px) scale(1)'
      this.elCalendar.nativeElement.style.transform = 'translateY(0px)'
      this.elCalendar.nativeElement.style.opacity = 0
    }
    this.setCalendarScrollHeight(this.showCalendar)
  }

  // TODO: Rename to something appropriate
  isNextTaskESMandNotNow() {
    const now = new Date().getTime()
    if (!this.showCalendar) {
      if (this.nextTask.name === 'ESM' && this.nextTask.timestamp > now) {
        this.elProgress.nativeElement.style.transform = `translateY(${
          this.elFooterHeight
        }px)`
        this.elInfo.nativeElement.style.transform = `translateY(${
          this.elFooterHeight
        }px)`
        this.elFooter.nativeElement.style.transform = `translateY(${
          this.elFooterHeight
        }px) scale(0)`
        this.elCalendar.nativeElement.style.transform = 'translateY(0px)'
        this.elCalendar.nativeElement.style.opacity = 0
      } else {
        this.elProgress.nativeElement.style.transform =
          'translateY(0px) scale(1)'
        this.elInfo.nativeElement.style.transform = 'translateY(0px)'
        this.elFooter.nativeElement.style.transform = 'translateY(0px) scale(1)'
        this.elCalendar.nativeElement.style.transform = 'translateY(0px)'
        this.elCalendar.nativeElement.style.opacity = 0
      }
    }
  }

  setCalendarScrollHeight(show: boolean) {
    if (show) {
      this.calendarScrollHeight =
        this.elContentHeight - this.elTickerHeight - this.elInfoHeight
    } else {
      this.calendarScrollHeight = 0
    }
  }

  applyCompletedTransformations() {
    if (this.showCompleted) {
      this.elTicker.nativeElement.style.padding = `0`
      this.elTicker.nativeElement.style.transform = `translateY(${this
        .elInfoHeight + this.elFooterHeight}px)`
      this.elInfo.nativeElement.style.transform = `translateY(${this
        .elInfoHeight + this.elFooterHeight}px) scale(0)`
      this.elFooter.nativeElement.style.transform = `translateY(${this
        .elInfoHeight + this.elFooterHeight}px) scale(0)`
    } else {
      this.elTicker.nativeElement.style.padding = '0 0 2px 0'
      this.elTicker.nativeElement.style.transform = 'translateY(0px)'
      this.elInfo.nativeElement.style.transform = 'translateY(0px) scale(1)'
      this.elFooter.nativeElement.style.transform = 'translateY(0px) scale(1)'
    }
  }

  openSettingsPage() {
    this.navCtrl.push(SettingsPage)
  }

  openClinicalTasksPage() {
    this.navCtrl.push(ClinicalTasksPage)
  }

  startQuestionnaire(task: Task) {
    this.hasClickedStartButton = true
    let startQuestionnaireTask = this.nextTask
    if (task) {
      if (task.completed === false) {
        startQuestionnaireTask = task
      }
    }
    const lang = this.storage.get(StorageKeys.LANGUAGE)
    const nextAssessment = this.controller.getAssessment(startQuestionnaireTask)
    Promise.all([lang, nextAssessment]).then(res => {
      const language = res[0].value
      const assessment = res[1]
      const params = {
        title: assessment.name,
        introduction: assessment.startText[language],
        endText: assessment.endText[language],
        questions: assessment.questions,
        associatedTask: startQuestionnaireTask
      }
      this.controller.updateAssessmentIntroduction(assessment)
      if (assessment.showIntroduction) {
        this.navCtrl.push(StartPage, params)
      } else {
        this.navCtrl.push(QuestionsPage, params)
      }
    })
  }

  showCredits() {
    const buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {
          console.log('Okay clicked')
        }
      }
    ]
    this.showAlert({
      title: this.translate.transform(LocKeys.CREDITS_TITLE.toString()),
      message: this.translate.transform(LocKeys.CREDITS_BODY.toString()),
      buttons: buttons
    })
  }

  showAlert(parameters) {
    const alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if (parameters.message) {
      alert.setMessage(parameters.message)
    }
    if (parameters.inputs) {
      for (let i = 0; i < parameters.inputs.length; i++) {
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }
}
