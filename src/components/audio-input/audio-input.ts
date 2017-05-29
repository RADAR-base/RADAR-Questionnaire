import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Device } from '@ionic-native/device'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile'
import { QuestionsPage } from '../../pages/questions/questions'
import { AnswerService } from '../../providers/answer-service'

declare const cordova: any
declare const window: any

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.html'
})
export class AudioInputComponent implements OnInit {

  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>()

  @Input() configFile = ''
  @Input() compressionLevel = 0
  @Input() qid = ''

  text: string
  fname: string
  name: string
  fpath: string
  recording: boolean
  value: string
  configfile: string
  compression: number
  answerB64: string
  platform = false
  permission = false

  answer = {
    id: null,
    value: null
  }

  // TODO: move messages to config, e.g., this.answer.value = 'Not Recorded yet'
  constructor (
    public questions: QuestionsPage,
    private answerService: AnswerService,
    private device: Device
  ) {
    // Checking if platform is android or not.
    // If not audio question won't be shown to users.
    if (this.device.platform === 'Android') {
      const fs: string = cordova.file.externalDataDirectory
      let path: string = fs
      path = path.substring(7, (path.length - 1))

      this.text = 'Start Recording'
      this.fpath = path
      this.recording = false
      this.platform = true
    }
  }

  ngOnInit () {
    if (this.device.platform === 'Android') {
      // Adding default answer for audio recording
      if (!this.answerService.check(this.qid)) {
        this.answer.id = this.qid
        this.answer.value = 'Not Recorded yet'
        this.answerService.add(this.answer)
      }
    }
  }

  success (message) {
    // add message
  }

  failure () {
    // TODO: design error screen
    alert('Error calling OpenSmile Plugin')
  }

  setRecordStatus () {
    this.questions.setAudioRecordStatus(this.recording)
  }

  start () {
    this.recording = this.questions.getAudioRecordStatus()
    this.questions.setQuestionID(this.qid)

    // Getting permission status from questions page
    this.permission = this.questions.getPermission()

    // Checking for platform and permission. If both are not true, code won't run
    if (this.platform && this.permission === true) {
      if (this.recording === false) {
        this.recording = true
        this.setRecordStatus()
        this.text = 'Stop Recording'
        this.fname = 'audio-opensmile.bin'
        this.questions.setFileName(this.fname)
        opensmile.start(this.fname, this.configFile, this.success, this.failure)
      } else if (this.recording === true) {
        this.value = this.fpath + '/' + this.fname
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

  // Read output file(bin) of opensmile and
  // convert it into base64 format and send it as answer
  readFile (fileName) {
    let ansB64 = null
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + '/' + fileName, (fileEntry) => {
      fileEntry.file((file) => {
        const reader = new FileReader()
        reader.onloadend = (e: any) => {
          ansB64 = e.target.result
          this.answerB64 = e.target.result
          this.valueChange.emit(this.answerB64)
        }
        reader.readAsDataURL(file)
      }, errorCallback)
    }, errorCallback)
    function errorCallback (error) {
      alert('ERROR: ' + error.code)
    }
  }

  isRecording () {
    return this.questions.getAudioRecordStatus()
  }

  setText () {
    if (this.questions.getAudioRecordStatus()) {
      return 'Stop Recording'
    } else {
      return 'Start Recording'
    }
  }

}
