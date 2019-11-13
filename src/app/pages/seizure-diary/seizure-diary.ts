import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, LoadingController } from 'ionic-angular';

import { ProtocolService } from '../../core/services/config/protocol.service'
import { QuestionnaireService } from '../../core/services/config/questionnaire.service'
import { ScheduleGeneratorService } from '../../core/services/schedule/schedule-generator.service'
import { TasksService } from '../home/services/tasks.service'
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
    private scheduleGenerator: ScheduleGeneratorService,
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
        text: this.localization.translateKey(LocKeys.BTN_NO),
        handler: () => console.log('clear local cancel')
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_YES),
        handler: () => {
          return this.seizureDiary.clear().then(() => this.refresh())
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SD_CLEAR_TITLE),
      message: this.localization.translateKey(LocKeys.SD_CLEAR_MESSAGE),
      buttons: buttons
    })
  }

  // refresh seizure diary data
  refresh(forcePull=false): Promise<boolean> {
    this.recentDiaryEvents = []
    this.olderDiaryEvents = []

    if (forcePull) var a = this.pullDiaryAssessment()
    else var a = this.getDiaryAssessment()
    var b = a.then(() => {return this.getEvents()})
    return Promise.all([a,b]).then(([A,B]) => {return A && B})
  }

  // pull diary assessment specification and questionnaire from github
  pullDiaryAssessment(): Promise<boolean> {
    console.log("Pulling seizure diary assessment from github...")
    var loader = this.presentLoading(this.localization.translateKey(LocKeys.SD_LOADING_MESSAGE));
    return new Promise<boolean>((resolve) => {
    this.protocol.pull() // pull protocol from github
      .then((protocol) => this.questionnaire.updateAssessments(TaskType.ALL, this.protocol.format(JSON.parse(protocol).protocols))) // pull protocol questionnaires from github
      .catch(() => {
        loader.dismiss()
        this.presentToast(this.localization.translateKey(LocKeys.SD_ERROR_NETWORK), 5000);
        resolve(false)
        throw new Error('No response from server')
      }) // handle network errors
      .then(([_A, _B, scheduledAssessments]) => scheduledAssessments.find(a => a.name === "Seizure Diary")) // select the seizure diary questionnaire
      .then((diaryAssessment) => { // update global var; will still be undefined if nothing was found, without exception
        this.diaryAssessment = diaryAssessment
        loader.dismiss()
        if (typeof this.diaryAssessment !== 'undefined'){
          this.presentToast(this.localization.translateKey(LocKeys.SD_LOADING_SUCCESS), 1000);
          resolve(true)
        } else {
          this.presentToast(this.localization.translateKey(LocKeys.SD_ERROR_LOADING), 5000);
          resolve(false)
        }
      })
    })
  }

  // get diary assessment specification and questionnaire from local storage; try pull if not available
  getDiaryAssessment(): Promise<boolean> {
    console.log("Getting seizure diary assessment from storage...")
    return new Promise<boolean>((resolve) => {
      this.questionnaire.getAssessments(TaskType.NON_CLINICAL)
        .then((assessments) => assessments.find(a => a.questionnaire.name === "seizure_diary"))
        .then((diaryAssessment) => {
          this.diaryAssessment = diaryAssessment
          if (typeof this.diaryAssessment !== 'undefined') resolve(true)
          else resolve(this.pullDiaryAssessment())
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
      this.getDiaryAssessment().then((success) => {
        if (success) this.showConfirmNewDiary()
      });
    } else {
      this.showConfirmNewDiary();
    }
  }

  // show new seizure confirmation dialog
  showConfirmNewDiary() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_NO),
        handler: () => console.log('new diary cancel')
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_YES),
        handler: () => {
          return this.startNewSeizureDiary()
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SD_NEW_TITLE),
      message: this.localization.translateKey(LocKeys.SD_NEW_MESSAGE),
      buttons: buttons
    })
  }

  // start the seizure diary questionnaire
  startNewSeizureDiary() {
    // create new seizure diary task
    const completionWindow = ScheduleGeneratorService.computeCompletionWindow(this.diaryAssessment)
    const diaryTask = this.scheduleGenerator.taskBuilder(0, this.diaryAssessment, new Date().getTime(), completionWindow);

    // try to start the created task
    if (this.tasksService.isTaskStartable(diaryTask)) {
      return this.navCtrl.push(QuestionsPageComponent, diaryTask)
    } else {
      this.presentToast(this.localization.translateKey(LocKeys.SD_ERROR_NEW), 5000);
    }
  }

  // show an alert with all seizure details
  seizureDetailAlert(eventData) {
    const detailString: string = 
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_1) + ":</b> " + eventData.diary_start_string + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_2) + ":</b> " + eventData.diary_duration_string + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_3) + ":</b> " + eventData.diary_unconscious + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_4) + ":</b> " + eventData.diary_awareness + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_5) + ":</b> " + eventData.diary_motor + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_6) + ":</b> " + eventData.diary_nonmotor + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_7) + ":</b> " + eventData.diary_confirmation + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_8) + ":</b> " + eventData.diary_wearable + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_9) + ":</b> " + eventData.diary_trigger + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_10) + ":</b> " + eventData.diary_trigger_detail + '<br/>' +
      "<b>" + this.localization.translateKey(LocKeys.SD_DETAIL_11) + ":</b> " + eventData.diary_trigger_other;

    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SD_DETAIL_TITLE),
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
