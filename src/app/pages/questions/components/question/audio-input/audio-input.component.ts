import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
import { NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { DefaultMaxAudioAttemptsAllowed } from '../../../../../../assets/data/defaultConfig'
import { AlertService } from '../../../../../core/services/misc/alert.service'
import { UsageService } from '../../../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../../../shared/enums/events'
import { LocKeys } from '../../../../../shared/enums/localisations'
import { TranslatePipe } from '../../../../../shared/pipes/translate/translate'
import { AudioRecordService } from '../../../services/audio-record.service'

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.component.html',
  styleUrls: ['audio-input.component.scss'],
  standalone: false,
})
export class AudioInputComponent implements OnDestroy, OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  onRecordStart: EventEmitter<any> = new EventEmitter<any>()
  @Input()
  text: string
  @Input()
  currentlyShown: boolean

  recordAttempts = 0
  buttonShown = true
  pauseListener: Subscription
  showInfoCard: boolean
  textLengthThreshold = 400
  backButtonListener: Subscription

  constructor(
    private audioRecordService: AudioRecordService,
    public navCtrl: NavController,
    public alertService: AlertService,
    private platform: Platform,
    private translate: TranslatePipe,
    private usage: UsageService
  ) {}

  ngOnInit() {
    // NOTE: Stop audio recording when application is on pause / backbutton is pressed
    this.pauseListener = this.platform.pause.subscribe(() => {
      if (this.isRecording()) {
        this.stopRecording()
        this.showTaskInterruptedAlert()
      }
    })

    this.backButtonListener = this.platform.backButton.subscribe(() => {
      this.stopRecording()
      navigator['app'].exitApp()
    })

    this.showInfoCard = this.text.length > this.textLengthThreshold
  }

  ngOnDestroy() {
    this.pauseListener.unsubscribe()
    this.backButtonListener.unsubscribe()
  }

  handleRecording() {
    if (!this.isRecording()) {
      this.recordAttempts++
      if (this.recordAttempts <= DefaultMaxAudioAttemptsAllowed)
        this.startRecording().catch(e => this.showTaskInterruptedAlert())
    } else {
      this.stopRecording().catch(e => this.showTaskInterruptedAlert())
      this.onRecordStart.emit(false)
      if (this.recordAttempts == DefaultMaxAudioAttemptsAllowed)
        this.finishRecording()
      else this.showAfterAttemptAlert()
    }
  }

  finishRecording() {
    this.buttonShown = false
    this.valueChange.emit(this.audioRecordService.getFormattedAudioData())
  }

  startRecording() {
    this.onRecordStart.emit(true)
    this.usage.sendGeneralEvent(UsageEventType.RECORDING_STARTED, true)
    return this.audioRecordService.startAudioRecording()
  }

  stopRecording() {
    this.usage.sendGeneralEvent(UsageEventType.RECORDING_STOPPED, true)
    return this.audioRecordService.stopAudioRecording()
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
      header: this.translate.transform(LocKeys.AUDIO_TASK_ALERT.toString()),
      message: this.translate.transform(
        LocKeys.AUDIO_TASK_ALERT_DESC.toString()
      ),
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {
            this.navCtrl.navigateRoot('')
          }
        }
      ],
      backdropDismiss: false
    })
  }

  showAfterAttemptAlert() {
    const attemptsLeft = DefaultMaxAudioAttemptsAllowed - this.recordAttempts
    this.alertService.showAlert({
      header: this.translate.transform(
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
      backdropDismiss: false
    })
  }
}
