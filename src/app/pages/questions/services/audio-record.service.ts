import { Injectable } from '@angular/core'
import { File } from '@ionic-native/file/ngx'
import { Media, MediaObject } from '@ionic-native/media/ngx'

@Injectable()
export class AudioRecordService {
  audioRecordStatus: boolean = false
  audio: MediaObject
  fileName = 'audio.mp3'

  constructor(private file: File, private media: Media) {
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
    this.audio = this.media.create(this.getPath() + this.fileName)
    this.audio.onSuccess.subscribe(() => this.success())
    this.audio.onError.subscribe(error => this.failure(error))

    const recording = this.getAudioRecordStatus()
    if (recording === false) {
      this.setAudioRecordStatus(true)
      this.audio.startRecord()
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
    return this.file.externalDataDirectory
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
