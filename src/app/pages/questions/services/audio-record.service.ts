import { Injectable } from '@angular/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Platform } from '@ionic/angular'

import { DefaultAudioRecordOptions } from '../../../../assets/data/defaultConfig'
import { LogService } from '../../../core/services/misc/log.service'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable({
  providedIn: 'root'
})
export class AudioRecordService {
  isRecording: boolean
  audio
  fileName = 'audio.m4a'

  constructor(private platform: Platform, private logger: LogService) {}

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
    return Directory.Documents
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

  async readAudioFile() {
    const contents = await Filesystem.readFile({
      path: this.fileName,
      directory: this.getDir(),
      encoding: Encoding.UTF8
    })
    this.destroy()
    console.log(contents)
    return contents
  }

  destroy() {
    if (this.audio) this.audio.release()
    this.isRecording = false
  }
}
