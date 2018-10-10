import { Injectable } from '@angular/core'
import { File } from '@ionic-native/file'
// file path to opensmile.js; Adding opensmile plugin
import * as opensmile from 'cordova-plugin-opensmile/www/opensmile'

declare var cordova: any
declare var window: any
@Injectable()
export class AudioRecordService {
  filename: string = 'audio-opensmile.bin'

  audioRecordStatus: boolean = false
  recording: boolean = false
  recordingTime: number = 45000

  constructor(private file: File) {
    // kill recording on load
    this.stopAudioRecording()
  }

  setAudioRecordStatus(status) {
    this.audioRecordStatus = status
  }
  getAudioRecordStatus() {
    return this.audioRecordStatus
  }

  startAudioRecording(configFile) {
    this.recording = this.getAudioRecordStatus()

    if (this.recording === false) {
      this.recording = true
      this.setRecordTimer()
      this.setAudioRecordStatus(this.recording)
      opensmile.start(this.filename, configFile, this.success, this.failure)
    } else if (this.recording === true) {
      this.recording = false
      this.setAudioRecordStatus(this.recording)
      opensmile.stop('Stop', this.success, this.failure)
      this.readAudioFile(this.filename)
    }
  }

  stopAudioRecording() {
    if (this.getAudioRecordStatus()) {
      opensmile.stop('Stop', this.success, this.failure)
      this.setAudioRecordStatus(false)
      this.readAudioFile(this.filename)
    }
  }

  setRecordTimer() {
    if (this.recording === true) {
      setTimeout(() => {
        console.log('Time up for recording')
        this.recording = false
        this.stopAudioRecording()
      }, this.recordingTime)
    }
  }

  getPath() {
    return this.file.externalDataDirectory
  }

  success(message) {
    console.log('OPENSMILE' + message)
  }

  failure(error) {
    console.log('OPENSMILE Error calling OpenSmile Plugin' + error)
  }

  readAudioFile(filename) {
    const filePath = this.getPath()
    console.log(filePath)
    this.file.readAsDataURL(filePath, filename).then(
      base64 => {
        console.log(base64)
      },
      error => {
        console.log(error)
      }
    )
  }
}

/*****************************

readAudioFile(filename) {
  var ans_b64 = null
  window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + '/' + filename, (fileEntry) => {
    fileEntry.file((file) => {
      var reader = new FileReader()
      reader.onloadend = (e: any) => {
        ans_b64 = e.target.result
        console.log(ans_b64)
        this.answer.id = this.questionID
        this.answer.value = ans_b64
        this.answerService.add(this.answer)
      };
      reader.readAsDataURL(file)
    }, errorCallback)
  }, errorCallback);
  function errorCallback(error) {
    alert("ERROR: " + error.code)
  }
}

*********************************/
