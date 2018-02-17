
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Device } from '@ionic-native/device'
import { NavController, AlertController } from 'ionic-angular'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
import { AnswerService } from '../../providers/answer-service'
import { QuestionsPage } from '../../pages/questions/questions'
import { AudioRecordService } from '../../providers/audiorecord-service'
import { AndroidPermissionUtility } from '../../utilities/android-permission'

declare var cordova: any
declare var window: any

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.html'
})

export class AudioInputComponent implements OnInit {
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input() configFile: string = ''
  @Input() compressionLevel: number = 0
  @Input() qid: string = ''
  text: string
  filename: string
  name: string
  filepath: string
  recording: boolean
  value: string = null
  configfile: string
  compression: number
  platform: boolean = false
  answer_b64: string = null
  permission: any

  answer = {
    id: null,
    value: null
  }
  ngOnInit() {
    if (this.device.platform == 'Android') {
      //Adding default answer for audio recording
      if (!this.answerService.check(this.qid)) {
        this.answer.id = this.qid
        this.answer.value = 'No Audio Recording'
        this.answerService.add(this.answer)
        this.valueChange.emit(this.answer.value) // add this at the end
      }
    }

  }


  constructor(
    public questions: QuestionsPage,
    private answerService: AnswerService,
    private audioRecordService: AudioRecordService,
    private permissionUtil: AndroidPermissionUtility,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private device: Device) {

    //Stop audio recording when application is on pause / backbutton is pressed
    document.addEventListener('pause', () => {
      console.log("on pause")
      //if (this.navCtrl.isActive(this.navCtrl.getActive()) == false) {
      this.audioRecordService.stopAudioRecording()
      //}
    });

    document.addEventListener("backbutton", () => {
      console.log("on backbutton")
      //if (this.navCtrl.isActive(this.navCtrl.getActive()) == false) {
      this.audioRecordService.stopAudioRecording()
      //}
    });

    this.permissionUtil.checkPermissions()

  }

  start() {
    this.permissionUtil.getRecordAudio_Permission().then((success) => {
      if (success == true) {
        this.audioRecordService.startAudioRecording(this.qid, this.configFile)
      }
    })
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
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: message,
      buttons: ['Dismiss']
    });
    alert.present();
  }

}
