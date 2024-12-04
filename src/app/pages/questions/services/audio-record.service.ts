import { Injectable } from '@angular/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Platform } from '@ionic/angular'
import {
  VoiceRecorder,
  VoiceRecorderPlugin,
  RecordingData,
  GenericResponse,
  CurrentRecordingStatus
} from 'capacitor-voice-recorder'

import { DefaultAudioRecordOptions } from '../../../../assets/data/defaultConfig'
import { LogService } from '../../../core/services/misc/log.service'

@Injectable({
  providedIn: 'root'
})
export class AudioRecordService {
  isRecording: boolean
  encoding = 'base64'
  data: any

  constructor(
    private logger: LogService
  ) {}

  startAudioRecording(): Promise<any> {
    return new Promise((resolve, reject) => {
      return VoiceRecorder.requestAudioRecordingPermission().then(
        (result: GenericResponse) => {
          return VoiceRecorder.startRecordingWithCompression({ sampleRate: 16000 })
            .then((result: GenericResponse) => {
              this.isRecording = true
            })
            .catch(error => {
              this.isRecording = false
              reject()
            })
        }
      )
    })
  }

  stopAudioRecording() {
    return VoiceRecorder.stopRecording()
      .then((result: RecordingData) => {
        this.isRecording = false
        this.data = result.value
        return result.value
      })
      .catch(error => {
        console.log(error)
        this.isRecording = false
        return Promise.reject(error)
      })
  }

  getFormattedAudioData() {
    const mimeType = this.data.mimeType
    const data = this.data.recordDataBase64
    return `data:${mimeType};${this.encoding},${data}`
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
}
