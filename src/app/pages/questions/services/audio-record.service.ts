import { Injectable } from '@angular/core'
import { File } from '@ionic-native/file/ngx'
import { Platform } from 'ionic-angular'

import { DefaultAudioRecordOptions } from '../../../../assets/data/defaultConfig'
import { LogService } from '../../../core/services/misc/log.service'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable()
export class AudioRecordService {
  isRecording: boolean
  audio
  fileName = 'audio.m4a'

  constructor(
    private file: File,
    private platform: Platform,
    private logger: LogService
  ) {}

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
    if (this.isRecording) {
      this.audio.stopRecord()
      this.isRecording = false
    }
  }

  getFilePath() {
    return this.platform.is('android')
      ? this.getDir() + this.fileName
      : this.fileName
  }

  getDir() {
    return this.platform.is('android')
      ? this.file.dataDirectory
      : this.file.tempDirectory
  }

  getIsRecording() {
    return this.isRecording
  }

  success() {
    this.logger.log('Action is successful')
  }

  failure(error) {
    this.logger.error('Error! ', error)
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
