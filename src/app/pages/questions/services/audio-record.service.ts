import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device/ngx'
import { File } from '@ionic-native/file/ngx'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable()
export class AudioRecordService {
  isRecording: boolean = false
  audio
  fileName = 'audio.m4a'

  constructor(private file: File, private device: Device) {
    // NOTE: Kill recording on load
    this.stopAudioRecording()
  }

  startAudioRecording(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording) this.isRecording = true
      else reject()

      this.audio = new Media(this.getFilePath(), this.success, this.failure)
      const options = { SampleRate: 16000, NumberOfChannels: 1 }
      if (this.isRecording) {
        return this.audio.startRecordWithCompression(options)
      } else {
        reject()
      }
    })
  }

  stopAudioRecording(): Promise<any> {
    if (this.isRecording) {
      this.audio.stopRecord()
      this.isRecording = false
      return this.readAudioFile()
    } else return Promise.reject()
  }

  getFilePath() {
    return this.device.platform == 'Android'
      ? this.getDir() + this.fileName
      : this.fileName
  }

  getDir() {
    return this.device.platform == 'Android'
      ? this.file.dataDirectory
      : this.file.tempDirectory
  }

  success() {
    console.log('Action is successful')
  }

  failure(error) {
    console.log('Error! ' + error)
    this.stopAudioRecording()
  }

  readAudioFile() {
    return this.file.readAsDataURL(this.getDir(), this.fileName)
  }

  destroy() {
    if (this.audio) this.audio.release()
  }
}
