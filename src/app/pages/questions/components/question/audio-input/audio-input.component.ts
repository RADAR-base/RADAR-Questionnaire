import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
import { NavController, Platform } from 'ionic-angular'

import { DefaultNumberofAudioAttempts } from '../../../../../../assets/data/defaultConfig'
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

  alertShown = false
  recordAttempts = 0
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

  handleRecording() {
    if (!this.isRecording()) {
      if (this.recordAttempts < DefaultNumberofAudioAttempts) {
        this.startRecording()
        this.recordAttempts++
      }
    } else this.stopRecording()
  }

  ngOnDestroy() {
    this.resumeListener.unsubscribe()
    this.pauseListener.unsubscribe()
  }

  startRecording() {
    this.permissionUtil.getRecordAudio_Permission().then(success => {
      if (success) {
        this.audioRecordService
          .startAudioRecording()
          .catch(e => this.showTaskInterruptedAlert())
      } else {
        this.showTaskInterruptedAlert()
      }
    })
  }

  stopRecording() {
    this.audioRecordService
      .stopAudioRecording()
      .then(data => {
        console.log(data)
        return this.valueChange.emit(data)
      })
      .catch(e => this.showTaskInterruptedAlert())
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
