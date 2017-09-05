import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Device } from '@ionic-native/device'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
import { AnswerService } from '../../providers/answer-service'
import { QuestionsPage } from '../../pages/questions/questions'
import { AudioRecordService } from '../../providers/audiorecord-service'

declare var cordova: any
declare var window: any


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
  filename: string
  name: string
  filepath: string
  recording: boolean
  value: string = null
  configfile: string
  compression: number
  platform: boolean = false
  answer_b64: string = null
  permission: boolean = false

  answer = {
    id: null,
    value: null
  }
  ngOnInit() {
    if (this.device.platform == 'Android') {
      //Adding default answer for audio recording
      if (!this.answerService.check(this.qid)) {
        this.answer.id = this.qid
        this.answer.value = 'Not Recorded yet'
        this.answerService.add(this.answer)
      }
    }
  }

  constructor(
    public questions: QuestionsPage,
    private answerService: AnswerService,
    private audioRecordService: AudioRecordService,
    private device: Device) {

    this.text = 'Start Recording'
    const fileSystem: string = cordova.file.externalDataDirectory;
    var path: string = fileSystem
    path = path.substring(7, (path.length - 1))
    this.filepath = path
    this.recording = false
    this.platform = true
  }

  success(message) {
  }

  failure() {
    alert('Error calling OpenSmile Plugin')
  }

  setRecordStatus() {
    this.audioRecordService.setAudioRecordStatus(this.recording)
  }

  start() {
    this.recording = this.audioRecordService.getAudioRecordStatus()
    this.audioRecordService.setQuestionID(this.qid)
    //Getting permission status from questions page
    this.permission = true // access from utils page later
    //Checking for platform and permission. If both are not true, code won't run
    if (this.permission == true) {
      if (this.recording == false) {
        this.recording = true
        this.setRecordStatus()
        this.text = 'Stop Recording'
        this.filename = 'audio-opensmile.bin'
        this.audioRecordService.setFileName(this.filename)
        opensmile.start(this.filename, this.configFile, this.success, this.failure)
      } else if (this.recording == true) {
        this.value = this.filepath + "/" + this.filename
        this.recording = false
        this.setRecordStatus()
        this.text = 'Start Recording'
        opensmile.stop('Stop', this.success, this.failure)
        this.readFile(this.filename)
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
      fileEntry.file((file) => {
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
    return this.audioRecordService.getAudioRecordStatus()
  }

  setText() {
    if (this.audioRecordService.getAudioRecordStatus()) {
      return 'Stop Recording'
    } else {
      return 'Start Recording'
    }
  }

}
