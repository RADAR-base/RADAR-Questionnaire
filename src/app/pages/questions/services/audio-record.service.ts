import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device/ngx'
import { File } from '@ionic-native/file/ngx'

import { DefaultAudioRecordOptions } from '../../../../assets/data/defaultConfig'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable()
export class AudioRecordService {
  isRecording: boolean = false
  audio
  fileName = 'audio.m4a'
  recordingTimeout

  constructor(private file: File, private device: Device) {
    // NOTE: Kill recording on load
    this.stopAudioRecording()
  }

  startAudioRecording(length): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording) this.isRecording = true
      else reject()

      this.audio = new Media(this.getFilePath(), this.success, this.failure)
      if (this.isRecording) {
        this.audio.startRecordWithCompression(DefaultAudioRecordOptions)
        this.recordingTimeout = setTimeout(() => {
          console.log('Time up for recording')
          this.stopAudioRecording()
          resolve(this.readAudioFile())
        }, length)
      } else {
        reject()
      }
    })
  }

  stopAudioRecording() {
    if (this.isRecording) {
      this.audio.stopRecord()
      this.isRecording = false
      clearTimeout(this.recordingTimeout)
    }
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
