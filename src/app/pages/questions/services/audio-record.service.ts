import { Injectable } from '@angular/core'
import { File } from '@ionic-native/file/ngx'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable()
export class AudioRecordService {
  audioRecordStatus: boolean = false
  audio
  fileName = 'audio.m4a'

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

  startAudioRecording() {
    this.audio = new Media(this.getPath() + this.fileName)
    const options = { SampleRate: 16000, NumberOfChannels: 1 }
    const recording = this.getAudioRecordStatus()

    if (recording === false) {
      this.setAudioRecordStatus(true)
      this.audio.startRecordWithCompression(options)
    } else if (recording === true) {
      this.setAudioRecordStatus(false)
      this.audio.stopRecord()
      this.readAudioFile()
    }
  }

  stopAudioRecording() {
    if (this.getAudioRecordStatus()) {
      this.audio.stopRecord()
      this.setAudioRecordStatus(false)
    }
  }

  getPath() {
    return this.file.dataDirectory
  }

  success() {
    console.log('Action is successful')
  }

  failure(error) {
    console.log('Error! ' + error)
  }

  readAudioFile() {
    return this.file.readAsDataURL(this.getPath(), this.fileName)
  }

  destroy() {
    if (this.audio) this.audio.release()
  }
}
