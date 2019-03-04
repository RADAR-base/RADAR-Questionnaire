import { Injectable } from '@angular/core'
import { File } from '@ionic-native/file/ngx'
// NOTE: File path to opensmile.js; Adding opensmile plugin
import * as opensmile from 'cordova-plugin-opensmile/www/opensmile'

declare var cordova: any
declare var window: any
@Injectable()
export class AudioRecordService {
  audioRecordStatus: boolean = false

  constructor(private file: File) {
    // NOTE: Kill recording on load
    this.stopAudioRecording()
  }

  setAudioRecordStatus(status) {
    this.audioRecordStatus = status
  }

  getAudioRecordStatus() {
    return this.audioRecordStatus
  }

  startAudioRecording(fileName, configFile) {
    const recording = this.getAudioRecordStatus()
    if (recording === false) {
      this.setAudioRecordStatus(true)
      opensmile.start(fileName, configFile, this.success, this.failure)
    } else if (recording === true) {
      this.setAudioRecordStatus(false)
      opensmile.stop('Stop', this.success, this.failure)
      this.readAudioFile(fileName)
    }
  }

  stopAudioRecording() {
    if (this.getAudioRecordStatus()) {
      opensmile.stop('Stop', this.success, this.failure)
      this.setAudioRecordStatus(false)
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
    return this.file.readAsDataURL(this.getPath(), filename)
  }
}
