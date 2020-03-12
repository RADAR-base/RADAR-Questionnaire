import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
import { NavController, Platform } from 'ionic-angular'
import { Subscription } from 'rxjs'

import { DefaultMaxAudioAttemptsAllowed } from '../../../../../../assets/data/defaultConfig'
import { AlertService } from '../../../../../core/services/misc/alert.service'
import { UsageService } from '../../../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../../../shared/enums/events'
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
export class AudioInputComponent implements OnDestroy, OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input()
  text: string
  @Input()
  currentlyShown: boolean

  recordAttempts = 0
  buttonShown = true
  pauseListener: Subscription
  showInfoCard: boolean
  textLengthThreshold = 400

  constructor(
    private audioRecordService: AudioRecordService,
    private permissionUtil: AndroidPermissionUtility,
    public navCtrl: NavController,
    public alertService: AlertService,
    private platform: Platform,
    private translate: TranslatePipe,
    private usage: UsageService
  ) {
    this.permissionUtil.checkPermissions()
    this.audioRecordService.destroy()
  }

  ngOnInit() {
    // NOTE: Stop audio recording when application is on pause / backbutton is pressed
    this.pauseListener = this.platform.pause.subscribe(() => {
      if (this.isRecording()) {
        this.stopRecording()
        this.showTaskInterruptedAlert()
      }
    })
    this.platform.registerBackButtonAction(() => {
      this.stopRecording()
      this.platform.exitApp()
    })
    this.showInfoCard = this.text.length > this.textLengthThreshold
  }

  ngOnDestroy() {
    this.pauseListener.unsubscribe()
  }

  handleRecording() {
    if (!this.isRecording()) {
      this.recordAttempts++
      if (this.recordAttempts <= DefaultMaxAudioAttemptsAllowed)
        this.startRecording().catch(e => this.showTaskInterruptedAlert())
    } else {
      this.stopRecording()
      if (this.recordAttempts == DefaultMaxAudioAttemptsAllowed)
        this.finishRecording().catch(e => this.showTaskInterruptedAlert())
      else this.showAfterAttemptAlert()
    }
  }

  finishRecording() {
    this.buttonShown = false
    return this.audioRecordService
      .readAudioFile()
      .then(data => this.valueChange.emit(data))
  }

  startRecording() {
    return Promise.all([
      this.permissionUtil.getRecordAudio_Permission(),
      this.permissionUtil.getWriteExternalStorage_permission()
    ]).then(res => {
      this.usage.sendGeneralEvent(UsageEventType.RECORDING_STARTED, true)
      return res[0] && res[1]
        ? this.audioRecordService.startAudioRecording()
        : Promise.reject()
    })
  }

  stopRecording() {
    this.audioRecordService.stopAudioRecording()
    this.usage.sendGeneralEvent(UsageEventType.RECORDING_STOPPED, true)
  }

  isRecording() {
    return this.audioRecordService.getIsRecording()
  }

  getRecordingButtonText() {
    return this.translate.transform(
      this.isRecording()
        ? LocKeys.BTN_STOP.toString()
        : LocKeys.BTN_START.toString()
    )
  }

  showTaskInterruptedAlert() {
    this.usage.sendGeneralEvent(UsageEventType.RECORDING_ERROR)
    this.alertService.showAlert({
      title: this.translate.transform(LocKeys.AUDIO_TASK_ALERT.toString()),
      message: this.translate.transform(
        LocKeys.AUDIO_TASK_ALERT_DESC.toString()
      ),
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {
            this.navCtrl.setRoot(HomePageComponent)
          }
        }
      ],
      enableBackdropDismiss: false
    })
  }

  showAfterAttemptAlert() {
    const attemptsLeft = DefaultMaxAudioAttemptsAllowed - this.recordAttempts
    this.alertService.showAlert({
      title: this.translate.transform(
        LocKeys.AUDIO_TASK_HAPPY_ALERT.toString()
      ),
      message:
        this.translate.transform(LocKeys.AUDIO_TASK_ATTEMPT_ALERT.toString()) +
        ': ' +
        attemptsLeft,
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_YES.toString()),
          handler: () => {
            this.finishRecording()
          }
        },
        {
          text:
            this.translate.transform(LocKeys.BTN_NO.toString()) +
            ', ' +
            this.translate.transform(LocKeys.BTN_TRY_AGAIN.toString()),
          handler: () => {}
        }
      ],
      enableBackdropDismiss: false
    })
  }
}
