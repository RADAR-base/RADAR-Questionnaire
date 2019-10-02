import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, LoadingController } from 'ionic-angular';

import { ProtocolService } from '../../core/services/config/protocol.service'
import { QuestionnaireService } from '../../core/services/config/questionnaire.service'
import { ScheduleGeneratorService } from '../../core/services/schedule/schedule-generator.service'
import { TasksService } from '../home/services/tasks.service'
import { QuestionsService } from '../questions/services/questions.service'
import { Assessment } from '../../shared/models/assessment'
import { TaskType } from '../../shared/utilities/task-type'
import { QuestionsPageComponent } from '../questions/containers/questions-page.component'

import { AlertService } from '../../core/services/misc/alert.service'
import { LocalizationService } from '../../core/services/misc/localization.service'
import { LocKeys } from '../../shared/enums/localisations'

import { SeizureDiaryService } from './seizure-diary.service'


/**
 * Generated class for the SeizureDiaryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-seizure-diary',
  templateUrl: 'seizure-diary.html',
})
export class SeizureDiaryPage {
  recentDiaryEvents: any[] = [];
  olderDiaryEvents: any[] = [];
  diaryAssessment: Assessment;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController,
    private tasksService: TasksService,
    private questionsService: QuestionsService,
    private schedule: ScheduleGeneratorService,
    private questionnaire: QuestionnaireService,
    private protocol: ProtocolService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private seizureDiary: SeizureDiaryService,
    )
  {
      this.refresh()
  }

  itemSelected(item) {
    this.seizureDetailAlert(item)
  }

  clearLocal() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_DISAGREE),
        handler: () => console.log('clear local cancel')
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_AGREE),
        handler: () => {
          return this.seizureDiary.clear().then(() => this.refresh())
        }
      }
    ]
    return this.alertService.showAlert({
      title: "Clear Diary",
      message: "You are about to clear the list of locally saved seizure events. This will not change anything on the server." +
        "<br/><br/>Are you sure?",
      buttons: buttons
    })
  }

  // refresh seizure diary data
  refresh(): Promise<boolean> {
    this.recentDiaryEvents = []
    this.olderDiaryEvents = []

    //return Promise.resolve(this.getDiaryAssessment().then(() => this.getRecentEvents()))
    //return Promise.all([this.getDiaryAssessment(), this.getRecentEvents()]).then(([A,B]) => {return A && B})
    var a = this.getDiaryAssessment()
    var b = a.then(() => {return this.getEvents()})
    return Promise.all([a,b]).then(([A,B]) => {return A && B})
  }

  // get diary assessment specification and questionnaire from github
  getDiaryAssessment(): Promise<boolean> {
    console.log("Pulling seizure diary assessment from github...")
    var loader = this.presentLoading("Loading diary specification...");
    return new Promise<boolean>((resolve) => {
    this.protocol.pull() // pull protocol from github
      .then((protocol) => this.questionnaire.updateAssessments(TaskType.ALL, this.protocol.format(JSON.parse(protocol).protocols))) // pull protocol questionnaires from github
      .catch(() => {
        loader.dismiss()
        this.presentToast("Network Error!");
        resolve(false)
        throw new Error('No response from server')
      }) // handle network errors
      .then(([_A, _B, scheduledAssessments]) => scheduledAssessments.find(a => a.name === "Seizure Diary")) // select the seizure diary questionnaire
      .then((diaryAssessment) => { // update global var; will still be undefined if nothing was found, without exception
        this.diaryAssessment = diaryAssessment
        loader.dismiss()
        if (typeof this.diaryAssessment !== 'undefined'){
          this.presentToast("Diary specification loaded.");
          resolve(true)
        } else {
          this.presentToast("Error loading diary specification!");
          resolve(false)
        }
      })
    })
  }

  // load  events from storage
  getEvents(): Promise<boolean> {
    console.log("Loading events from storage...")
    //var loader = this.presentLoading("Loading events...");
    return new Promise<boolean>((resolve) => {
      this.seizureDiary.getEvents()
        .then(([recentEvents, olderEvents]) => {
          //loader.dismiss()
          this.recentDiaryEvents = recentEvents !== null ? this.seizureDiary.processEvents(recentEvents).sort(this.seizureDiary.compareEvents).reverse() : []
          this.olderDiaryEvents = olderEvents !== null ? this.seizureDiary.processEvents(olderEvents).sort(this.seizureDiary.compareEvents).reverse() : []
          console.log("Recent:", this.recentDiaryEvents)
          console.log("Older:", this.olderDiaryEvents)
          //this.presentToast("Events loaded.");
          resolve(true)
        })
    })
  }

  // add seizure button callback
  addSeizure() {
    // pull seizure diary assessment specs if needed
    if (typeof this.diaryAssessment === 'undefined') {
      this.getDiaryAssessment();
    } else {
      this.showConfirmNewDiary();
    }
  }

  // show new seizure confirmation dialog
  showConfirmNewDiary() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_DISAGREE),
        handler: () => console.log('new diary cancel')
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_AGREE),
        handler: () => {
          return this.startNewSeizureDiary()
        }
      }
    ]
    return this.alertService.showAlert({
      title: "New Diary Entry",
      message: "Do you want to add a new seizure event to the diary?",
      buttons: buttons
    })
  }

  // start the seizure diary questionnaire
  startNewSeizureDiary() {
    // create new seizure diary task
    const completionWindow = ScheduleGeneratorService.computeCompletionWindow(this.diaryAssessment)
    const diaryTask = this.schedule.taskBuilder(0, this.diaryAssessment, new Date().getTime(), completionWindow);

    // try to start the created task
    if (this.tasksService.isTaskStartable(diaryTask)) {
      console.log("seizure-diary::startNewSeizureDiary()")
      return this.questionsService
        .getQuestionnairePayload(diaryTask)
        .then(payload => this.navCtrl.push(QuestionsPageComponent, payload))
    } else {
      alert("task not startable")
    }
  }

  // show an alert with all seizure details
  seizureDetailAlert(eventData) {
    const detailString: string = 
      "<b>Start:</b> " + eventData.diary_start_string + '<br/>' +
      "<b>Duration:</b> " + eventData.diary_duration_string + '<br/>' +
      "<b>Unconscious:</b> " + eventData.diary_unconscious + '<br/>' +
      "<b>Aware:</b> " + eventData.diary_awareness + '<br/>' +
      "<b>Motor:</b> " + eventData.diary_motor + '<br/>' +
      "<b>Non-Motor:</b> " + eventData.diary_nonmotor + '<br/>' +
      "<b>Confirmed:</b> " + eventData.diary_confirmation + '<br/>' +
      "<b>Wearable:</b> " + eventData.diary_wearable + '<br/>' +
      "<b>Trigger:</b> " + eventData.diary_trigger + '<br/>' +
      "<b>Trigger Detail:</b> " + eventData.diary_trigger_detail + '<br/>' +
      "<b>Trigger Other:</b> " + eventData.diary_trigger_other;

    return this.alertService.showAlert({
      title: "Seizure Detail",
      message: detailString,
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {}
        }
      ]
    })
  }

  // present a toast message
  presentToast(msg, timeout=2000) {
    const toast = this.toastCtrl.create({
      message: msg,
      duration: timeout
    });
    toast.present();
  }

  // present a loading message
  presentLoading(msg="Loading...", timeout=5000, spinner='crescent') {
    let loading = this.loadingCtrl.create({
      content: msg,
      spinner: spinner
    });
  
    loading.present();
  
    if (timeout > 0) {
      setTimeout(() => {
        loading.dismiss();
      }, timeout);
    }

    return loading
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SeizureDiaryPage');
  }

}
