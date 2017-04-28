import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { MediaPlugin, Device } from 'ionic-native'
import * as cordova1 from 'cordova'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
import { AnswerService } from '../../providers/answer-service'
import { QuestionsPage } from '../../pages/questions/questions'
declare var cordova: any
declare var window: any

/*
  Generated class for the AudioInput component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/

@Component({
    selector: 'audio-input',
    templateUrl: 'audio-input.html'
})
export class AudioInputComponent implements OnInit {
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>()
  @Input() configFile: string = ''
  @Input() compressionLevel: number = 0
  @Input() qid: string = ''
  text: string
  fname: string
  name: string
  fpath: string
  recording: boolean
  value: string = null
  configfile: string
  compression: number
  media: MediaPlugin = null
  platform: boolean = false
  answer_b64: string = null
  permission: boolean = false

  answer = {
    id: null,
    value: null
  }
  ngOnInit() {
    if (Device.platform == 'Android') {
      //Adding default answer for audio recording
      if (!this.answerService.check(this.qid)) {
        this.answer.id = this.qid
        this.answer.value = 'Not Recorded yet'
        this.answerService.add(this.answer)
      }
    }
  }

  constructor(public questions: QuestionsPage, private answerService: AnswerService) {
    //Checking platform is android or not. If platform is not android audio question won't be shown to users
    if (Device.platform == 'Android') {
      this.text = 'Start Recording'
      const fs: string = cordova.file.externalDataDirectory;
      var path: string = fs
      path = path.substring(7, (path.length - 1))
      this.fpath = path
      this.recording = false
      this.platform = true
    } else {
    }
  }

  success(message) {
  }

  failure() {
    alert('Error calling OpenSmile Plugin')
  }

  setRecordStatus(){
    this.questions.setAudioRecordStatus(this.recording)
  }

  start() {
    this.recording = this.questions.getAudioRecordStatus()
    this.questions.setQuestionID(this.qid)
    //Getting permission status from questions page
    this.permission = this.questions.getPermission()		  
    //Checking for platform and permission. If both are not true, code won't run
    if (this.platform && this.permission == true) {
      if (this.recording == false) {
        this.recording = true
        this.setRecordStatus()
        this.text = 'Stop Recording'
        this.fname = 'audio-opensmile.bin'
        this.questions.setFileName(this.fname)
        opensmile.start(this.fname, this.configFile, this.success, this.failure)
      } else if (this.recording == true) {
        this.value = this.fpath + "/" + this.fname
        this.recording = false
        this.setRecordStatus()
        this.text = 'Start Recording'
        opensmile.stop('Stop', this.success, this.failure)
		    this.readFile(this.fname)
      }
    } else {
      this.value = 'Permission not granted'
      this.valueChange.emit(this.value)
      alert('Permissions not granted; Go to next question')
    }
  }

  //Read output file(bin) of opensmile and convert it into base64 format and send it as answer
  readFile(file_name) {
    var ans_b64 = null
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + '/' + file_name, (fileEntry) => {
      fileEntry.file( (file) => {
        var reader = new FileReader()
        reader.onloadend = (e: any) => {
          ans_b64 = e.target.result
          this.answer_b64 = e.target.result
          this.valueChange.emit(this.answer_b64)
        };
        reader.readAsDataURL(file)
      }, errorCallback)
    }, errorCallback);
    function errorCallback(error) {
      alert("ERROR: " + error.code)
    }
  }

  isRecording() {
    return this.questions.getAudioRecordStatus()
  }

  setText() {
    if (this.questions.getAudioRecordStatus()) {
      return 'Stop Recording'
    } else {
      return 'Start Recording'
    }
  }
  
}
