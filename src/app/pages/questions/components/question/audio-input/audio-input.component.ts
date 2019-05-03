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

import {
  DefaultAudioAttemptThreshold,
  DefaultMaxAudioAttemptsAllowed
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
export class AudioInputComponent implements OnDestroy, OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input()
  sections: Section[]
  @Input()
  currentlyShown: boolean

  recordAttempts = 0
  buttonShown = true
  buttonDisabled = false
  buttonTransitionDelay = 1000
  resumeListener: Subscription
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
    this.resumeListener = this.platform.resume.subscribe(() =>
      this.showTaskInterruptedAlert()
    )
    // NOTE: Stop audio recording when application is on pause / backbutton is pressed
    this.pauseListener = this.platform.pause.subscribe(() =>
      this.stopAndGetRecording()
    )
    this.platform.registerBackButtonAction(() => {
      this.stopAndGetRecording()
      this.platform.exitApp()
    })
  }

  ngOnDestroy() {
    this.resumeListener.unsubscribe()
    this.pauseListener.unsubscribe()
  }

  handleRecording() {
    if (!this.isRecording()) {
      this.recordAttempts++
      if (this.recordAttempts <= DefaultMaxAudioAttemptsAllowed) {
        if (this.recordAttempts > DefaultAudioAttemptThreshold)
          this.showAttemptAlert()
        this.transitionButton()
        this.startRecording().catch(e => this.showTaskInterruptedAlert())
      }
    } else {
      this.stopAndGetRecording().catch(e => this.showTaskInterruptedAlert())
      if (this.recordAttempts == DefaultMaxAudioAttemptsAllowed)
        this.buttonShown = false
    }
  }

  transitionButton() {
    this.buttonDisabled = true
    setTimeout(() => (this.buttonDisabled = false), this.buttonTransitionDelay)
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

  stopAndGetRecording() {
    this.audioRecordService.stopAudioRecording()
    return this.audioRecordService.readAudioFile().then(data => {
      console.log(data)
      return this.valueChange.emit(data)
    })
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
      ]
    })
  }

  showAttemptAlert() {
    const attemptsLeft = DefaultMaxAudioAttemptsAllowed - this.recordAttempts
    this.alertService.showAlert({
      title:
        this.translate.transform(LocKeys.AUDIO_TASK_ATTEMPT_ALERT.toString()) +
        ': ' +
        attemptsLeft,
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {}
        }
      ]
    })
  }
}
