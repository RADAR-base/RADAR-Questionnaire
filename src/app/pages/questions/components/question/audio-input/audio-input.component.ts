import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
import { NavController, Platform } from 'ionic-angular'

import { AlertService } from '../../../../../core/services/misc/alert.service'
import { AndroidPermissionUtility } from '../../../../../shared/utilities/android-permission'
import { AudioRecordService } from '../../../services/audio-record.service'
import { DefaultMaxAudioAttemptsAllowed } from '../../../../../../assets/data/defaultConfig'
import { HomePageComponent } from '../../../../home/containers/home-page.component'
import { LocKeys } from '../../../../../shared/enums/localisations'
import { Section } from '../../../../../shared/models/question'
import { Subscription } from 'rxjs'
import { TranslatePipe } from '../../../../../shared/pipes/translate/translate'

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.component.html'
})
export class AudioInputComponent implements OnDestroy, OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input()
  sections: Section[]
  @Input()
  currentlyShown: boolean

  recordAttempts = 0
  buttonShown = true
  pauseListener: Subscription

  constructor(
    private audioRecordService: AudioRecordService,
    private permissionUtil: AndroidPermissionUtility,
    public navCtrl: NavController,
    public alertService: AlertService,
    private platform: Platform,
    private translate: TranslatePipe
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
    this.enableNextButton()
  }

  ngOnDestroy() {
    this.pauseListener.unsubscribe()
  }

  handleRecording() {
    if (!this.isRecording()) {
      this.recordAttempts++
      if (this.recordAttempts <= DefaultMaxAudioAttemptsAllowed) {
        this.startRecording().catch(e => this.showTaskInterruptedAlert())
      }
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

  enableNextButton() {
    this.valueChange.emit('')
  }

  startRecording() {
    return Promise.all([
      this.permissionUtil.getRecordAudio_Permission(),
      this.permissionUtil.getWriteExternalStorage_permission()
    ]).then(res =>
      res[0] && res[1]
        ? this.audioRecordService.startAudioRecording()
        : Promise.reject()
    )
  }

  stopRecording() {
    this.audioRecordService.stopAudioRecording()
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
