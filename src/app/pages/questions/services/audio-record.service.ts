import { DefaultAudioRecordOptions } from '../../../../assets/data/defaultConfig'
import { Device } from '@ionic-native/device/ngx'
import { File } from '@ionic-native/file/ngx'
import { Injectable } from '@angular/core'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable()
export class AudioRecordService {
  isRecording: boolean
  audio
  fileName = 'audio.m4a'

  constructor(private file: File, private device: Device) {}

  startAudioRecording(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording) this.isRecording = true
      else reject()

      this.audio = new Media(this.getFilePath(), this.success, this.failure)
      if (this.isRecording) {
        return this.audio.startRecordWithCompression(DefaultAudioRecordOptions)
      } else {
        reject()
      }
    })
  }

  stopAudioRecording() {
    this.audio.stopRecord()
    this.isRecording = false
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

  getIsRecording() {
    return this.isRecording
  }

  success() {
    console.log('Action is successful')
  }

  failure(error) {
    console.log('Error! ' + JSON.stringify(error))
  }

  readAudioFile() {
    return this.file.readAsDataURL(this.getDir(), this.fileName).then(data => {
      this.destroy()
      return data
    })
  }

  destroy() {
    if (this.audio) this.audio.release()
    this.isRecording = false
  }
}
