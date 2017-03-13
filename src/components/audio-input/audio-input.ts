import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { MediaPlugin, Device } from 'ionic-native'
import * as cordova1 from 'cordova'
import * as opensmile from '../../../plugins/plugin.opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
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
      if (!this.answerService.check(this.qid)) {		  //Adding default answer for audio recording
        this.answer.id = this.qid
        this.answer.value = 'Not Recorded yet'
        this.answerService.add(this.answer)
      }
    }
  }

  constructor(public questions: QuestionsPage, private answerService: AnswerService) {
    if (Device.platform == 'Android') {			    //Checking platform is android or not. If platform is not android audio question won't be shown to users
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
  startRecording(fullPath) {						      //Starting audio recording
    this.media = new MediaPlugin(fullPath)
    this.media.startRecord()
  }

  stopRecording() {								          //Stoping audio recording
    this.media.stopRecord()
  }

  success(message) {
  }

  failure() {
    alert('Error calling OpenSmile Plugin')
  }
  setRecordStatus(){
    this.answerService.setAudioRecordStatus(this.recording)
  }
  start() {
    this.recording = this.answerService.getAudioRecordStatus()
    this.permission = this.questions.getPermission()		//Getting permission status from questions page
    if (this.platform && this.permission == true) {		  	// Checking for platform and permission. If both are not true, code won't run
      if (this.recording == false) {
        var displayDate = new Date()
        var date = displayDate.toISOString()
        date = date.replace(/\./g, '-')
        date = date.replace(/\:/g, '-')
        this.name = 'audio' + this.qid + '-' + date
        this.recording = true
        this.setRecordStatus()
        this.text = 'Stop Recording'
        if (this.compressionLevel == 1) {
          this.fname = this.name + '-opensmile.bin'
          opensmile.start(this.fname, this.configFile, this.success, this.failure)
        } else {
          this.fname = this.name + '.mp3'
          var fullPath = this.fpath + "/" + this.fname
          this.startRecording(fullPath)
        }
      } else if (this.recording == true) {
        this.value = this.fpath + "/" + this.fname
        this.recording = false
        this.setRecordStatus()
        this.text = 'Start Recording'
        if (this.compressionLevel == 1) {
          opensmile.stop('Stop', this.success, this.failure)
        } else {
          this.stopRecording()
        }
		    this.readFile(this.fname)
      }
    } else {
      this.value = 'Permission not granted'
      this.valueChange.emit(this.value)
      alert('Permissions not granted; Go to next question')
    }
  }
  readFile(file_name) {								        //Read file and convert it into base64 format and send it as answer
    var ans_b64 = null
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + '/' + file_name, (fileEntry) => {
      fileEntry.file( (file) => {
        var reader = new FileReader()
        reader.onloadend = (e: any) => {
          ans_b64 = e.target.result
          this.answer_b64 = e.target.result
		  alert(this.answer_b64)
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
    return this.answerService.getAudioRecordStatus()
  }
  setText() {
    if (this.answerService.getAudioRecordStatus()) {
      return 'Stop Recording'
    } else {
      return 'Start Recording'
    }
  }
}
