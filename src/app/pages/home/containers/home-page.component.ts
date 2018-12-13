import { Component, ElementRef, ViewChild } from '@angular/core'
import { Content, NavController, Platform } from 'ionic-angular'

import { DefaultTask } from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import { Task, TasksProgress } from '../../../shared/models/task'
import { checkTaskIsNow } from '../../../shared/utilities/check-task-is-now'
import { ClinicalTasksPageComponent } from '../../clinical-tasks/containers/clinical-tasks-page.component'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { SettingsPageComponent } from '../../settings/containers/settings-page.component'
import { StartPageComponent } from '../../start/containers/start-page.component'
import { TasksService } from '../services/tasks.service'
import { AlertService } from '../../../core/services/alert.service'
import { LocalizationService } from '../../../core/services/localization.service'

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html'
})
export class HomePageComponent {
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

  tasks: Promise<Task[]>
  nextTask: Task = DefaultTask
  showCalendar: boolean = false
  showCompleted: boolean = false
  showNoTasksToday: boolean = false
  tasksProgress: TasksProgress
  calendarScrollHeight: number = 0
  startingQuestionnaire: boolean = false
  hasClinicalTasks = false
  hasOnlyESMs = false
  taskIsNow = false
  elProgressOffset = 16
  nextTaskIsLoading = true

  constructor(
    public navCtrl: NavController,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    public storage: StorageService,
    private platform: Platform,
    private kafka: KafkaService
  ) {
    this.platform.resume.subscribe(e => {
      this.kafka.sendAllAnswersInCache()
      this.updateCurrentTask()
    })
  }

  ionViewWillEnter() {
    this.tasks = this.tasksService.getTasksOfToday()
    this.tasks.then(
      tasks => (this.tasksProgress = this.tasksService.getTaskProgress(tasks))
    )
    this.getElementsAttributes()
    this.elProgressHeight += this.elProgressOffset
    this.applyTransformations()
    this.showNoTasksToday = false
    this.startingQuestionnaire = false
  }

  ionViewDidLoad() {
    setInterval(() => {
      this.updateCurrentTask()
    }, 1000)
    this.evalHasClinicalTasks()
    this.checkIfOnlyESM()
    this.tasksService.sendNonReportedTaskCompletion()
  }

  updateCurrentTask() {
    this.checkForNextTask()
    this.taskIsNow = checkTaskIsNow(this.nextTask.timestamp)
  }

  checkForNextTask() {
    if (!this.showCalendar) {
      this.nextTaskIsLoading = true
      this.tasks.then(tasks =>
        this.checkForNextTaskGeneric(this.tasksService.getNextTask(tasks))
      )
    }
  }

  checkForNextTaskGeneric(task) {
    if (task && task.isClinical == false) {
      this.nextTask = task
      this.displayCompleted(false)
      this.displayEvalTransformations(false)
      this.taskIsNow = checkTaskIsNow(this.nextTask.timestamp)
    } else {
      this.tasksService.areAllTasksComplete().then(completed => {
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
    this.nextTaskIsLoading = false
  }

  checkIfOnlyESM() {
    this.tasks.then(tasks => {
      this.hasOnlyESMs = tasks.every(t => t.name === 'ESM')
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
    if (this.elContent) this.elContentHeight = this.elContent.contentHeight
    if (this.elProgress)
      this.elProgressHeight =
        this.elProgress.nativeElement.offsetHeight - this.elProgressOffset
    if (this.elTicker)
      this.elTickerHeight = this.elTicker.nativeElement.offsetHeight
    if (this.elInfo) this.elInfoHeight = this.elInfo.nativeElement.offsetHeight
    if (this.elFooter)
      this.elFooterHeight = this.elFooter.nativeElement.offsetHeight
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
      if (this.elProgress)
        this.elProgress.nativeElement.style.transform =
          'translateY(0px) scale(1)'
      if (this.elTicker)
        this.elTicker.nativeElement.style.transform = 'translateY(0px)'
      if (this.elInfo)
        this.elInfo.nativeElement.style.transform = 'translateY(0px)'
      if (this.elFooter)
        this.elFooter.nativeElement.style.transform = 'translateY(0px) scale(1)'
      if (this.elCalendar) {
        this.elCalendar.nativeElement.style.transform = 'translateY(0px)'
        this.elCalendar.nativeElement.style.opacity = 0
      }
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
      if (this.elTicker) {
        this.elTicker.nativeElement.style.padding = '0 0 2px 0'
        this.elTicker.nativeElement.style.transform = 'translateY(0px)'
      }
      if (this.elInfo)
        this.elInfo.nativeElement.style.transform = 'translateY(0px) scale(1)'
      if (this.elFooter)
        this.elFooter.nativeElement.style.transform = 'translateY(0px) scale(1)'
    }
  }

  openSettingsPage() {
    this.navCtrl.push(SettingsPageComponent)
  }

  openClinicalTasksPage() {
    this.navCtrl.push(ClinicalTasksPageComponent)
  }

  startQuestionnaire(taskCalendarTask: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    let startQuestionnaireTask = this.nextTask
    if (taskCalendarTask) {
      if (taskCalendarTask.completed === false) {
        startQuestionnaireTask = taskCalendarTask
      }
    } else {
      this.startingQuestionnaire = true
    }

    Promise.all([
      this.storage.get(StorageKeys.LANGUAGE),
      this.tasksService.getAssessment(startQuestionnaireTask)
    ]).then(([lang, assessment]) => {
      const language = lang.value
      const params = {
        title: assessment.name,
        introduction: assessment.startText[language],
        endText: assessment.endText[language],
        questions: assessment.questions,
        associatedTask: startQuestionnaireTask,
        assessment: assessment,
        isLastTask: false
      }

      this.tasksService
        .isLastTask(startQuestionnaireTask, this.tasks)
        .then(lastTask => (params.isLastTask = lastTask))
        .then(() => {
          if (assessment.showIntroduction) {
            this.navCtrl.push(StartPageComponent, params)
          } else {
            this.navCtrl.push(QuestionsPageComponent, params)
          }
        })
    })
  }

  showCredits() {
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.CREDITS_TITLE),
      message: this.localization.translateKey(LocKeys.CREDITS_BODY),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {}
        }
      ]
    })
  }
}
