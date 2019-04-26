import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
import { NavController, Platform } from 'ionic-angular'

import {
  MIN_SEC,
  SEC_MILLISEC
} from '../../../../../../assets/data/defaultConfig'
import { AlertService } from '../../../../../core/services/alert.service'
import { LocKeys } from '../../../../../shared/enums/localisations'
import { Section } from '../../../../../shared/models/question'
import { TranslatePipe } from '../../../../../shared/pipes/translate/translate'
import { AndroidPermissionUtility } from '../../../../../shared/utilities/android-permission'
import { HomePageComponent } from '../../../../home/containers/home-page.component'
import { AudioRecordService } from '../../../services/audio-record.service'

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.component.html'
})
export class AudioInputComponent implements OnChanges, OnDestroy, OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input()
  sections: Section[]
  @Input()
  currentlyShown: boolean

  avgWordsPerMinute = 100
  alertShown = false
  resumeListener
  pauseListener

  constructor(
    private audioRecordService: AudioRecordService,
    private permissionUtil: AndroidPermissionUtility,
    public navCtrl: NavController,
    public alertService: AlertService,
    private platform: Platform,
    private translate: TranslatePipe
  ) {
    this.permissionUtil.checkPermissions()
  }

  ngOnInit() {
    this.resumeListener = this.platform.resume.subscribe(() =>
      this.showTaskInterruptedAlert()
    )
    // NOTE: Stop audio recording when application is on pause / backbutton is pressed
    this.pauseListener = this.platform.pause.subscribe(() =>
      this.stopRecording()
    )
    this.platform.registerBackButtonAction(() => {
      this.stopRecording()
      this.platform.exitApp()
    })
  }

  ngOnDestroy() {
    this.resumeListener.unsubscribe()
    this.pauseListener.unsubscribe()
    this.audioRecordService.destroy()
  }

  ngOnChanges() {
    if (this.currentlyShown) this.startRecording()
  }

  startRecording() {
    this.permissionUtil.getRecordAudio_Permission().then(success => {
      if (success) {
        this.audioRecordService
          .startAudioRecording(this.getRecordingTime())
          .then(data => this.valueChange.emit(data))
          .catch(e => this.showTaskInterruptedAlert())
      } else {
        this.showTaskInterruptedAlert()
      }
    })
  }

  stopRecording() {
    this.audioRecordService.stopAudioRecording()
  }

  getRecordingTime() {
    return (
      (this.sections
        .map(section => section.label)
        .toString()
        .split(' ').length /
        this.avgWordsPerMinute) *
      (MIN_SEC * SEC_MILLISEC)
    )
  }

  showTaskInterruptedAlert() {
    if (!this.alertShown) {
      const buttons = [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {
            this.navCtrl.setRoot(HomePageComponent)
          }
        }
      ]
      this.alertService.showAlert({
        title: this.translate.transform(LocKeys.AUDIO_TASK_ALERT.toString()),
        message: this.translate.transform(
          LocKeys.AUDIO_TASK_ALERT_DESC.toString()
        ),
        buttons: buttons
      })
      this.alertShown = true
    }
  }
}
