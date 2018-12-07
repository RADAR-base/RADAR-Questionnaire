import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core'
import { Device } from '@ionic-native/device'
import { AlertController, NavController } from 'ionic-angular'

// NOTE: File path to opensmile.js; Adding opensmile plugin
import * as opensmile from '../../../../../../../plugins/cordova-plugin-opensmile/www/opensmile'
import {
  MIN_SEC,
  SEC_MILLISEC
} from '../../../../../../assets/data/defaultConfig'
import { Answer } from '../../../../../shared/models/answer'
import { Section } from '../../../../../shared/models/question'
import { AndroidPermissionUtility } from '../../../../../shared/utilities/android-permission'
import { QuestionsPageComponent } from '../../../containers/questions-page.component'
import { AudioRecordService } from '../../../services/audio-record.service'

declare var cordova: any
declare var window: any

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.component.html'
})
export class AudioInputComponent implements OnInit, OnChanges {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input()
  sections: Section[]
  @Input()
  currentlyShown: boolean

  fileName = 'audio-opensmile.bin'
  name: string
  filepath: string
  value: string = null
  configFile = 'liveinput_android.conf'
  compression = 1
  platform = false
  answer_b64: string = null
  permission: any
  avgWordsPerMinute = 200

  ngOnInit() {}

  ngOnChanges() {
    if (this.currentlyShown) {
      this.startRecording()
    }
  }

  constructor(
    public questions: QuestionsPageComponent,
    private audioRecordService: AudioRecordService,
    private permissionUtil: AndroidPermissionUtility,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private device: Device
  ) {
    // NOTE: Stop audio recording when application is on pause / backbutton is pressed
    document.addEventListener('pause', () => {
      console.log('on pause')
      // if (this.navCtrl.isActive(this.navCtrl.getActive()) == false) {
      this.audioRecordService.stopAudioRecording()
      // }
    })

    document.addEventListener('backbutton', () => {
      console.log('on backbutton')
      // if (this.navCtrl.isActive(this.navCtrl.getActive()) == false) {
      this.audioRecordService.stopAudioRecording()
      // }
    })

    this.permissionUtil.checkPermissions()
  }

  startRecording() {
    this.permissionUtil.getRecordAudio_Permission().then(success => {
      if (success === true) {
        this.audioRecordService.startAudioRecording(
          this.fileName,
          this.configFile
        )
        setTimeout(() => {
          console.log('Time up for recording')
          this.audioRecordService.stopAudioRecording()
          this.audioRecordService
            .readAudioFile(this.fileName)
            .then(data => this.valueChange.emit(data))
        }, this.getRecordingTime())
      }
    })
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

  isRecording() {
    return this.audioRecordService.getAudioRecordStatus()
  }

  setText() {
    if (this.audioRecordService.getAudioRecordStatus()) {
      return 'Stop Recording'
    } else {
      return 'Start Recording'
    }
  }

  showAlert(title, message) {
    const alert = this.alertCtrl.create({
      title: title,
      subTitle: message,
      buttons: ['Dismiss']
    })
    alert.present()
  }
}
