import { Injectable } from '@angular/core';
import * as opensmile from 'cordova-plugin-opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
import { AnswerService } from './answer-service'
declare var cordova: any
declare var window: any

@Injectable()
export class AudioRecordService {

  fileName: string = null
  questionID: string = null
  audioRecordStatus: boolean = false;

  answer = {
    id: null,
    value: null
  }

  constructor(private answerService: AnswerService) {

    // kill recording on load
    this.stopAudioRecording()

    //Stop audio recording when application is on pause / backbutton is pressed
    document.addEventListener('pause', () => {
      console.log("on pause")
      this.stopAudioRecording()
    });
    //Stop opensmile when back button is pressed
    document.addEventListener("backbutton", () => {
      console.log("on backbutton")
      this.stopAudioRecording()
    });
  }

  setFileName(file_name) {
    this.fileName = file_name
  }

  setQuestionID(qid) {
    this.questionID = qid
  }

  setAudioRecordStatus(status) {
    this.audioRecordStatus = status
  }
  getAudioRecordStatus() {
    return this.audioRecordStatus
  }




  stopAudioRecording() {
    if (this.getAudioRecordStatus()) {
      opensmile.stop('Stop', this.success, this.failure)
      this.setAudioRecordStatus(false)
      this.readAudioFile()
    }
  }

  success(message) {
    console.log(message)
  }

  failure(error) {
    console.log('Error calling OpenSmile Plugin' + error)
  }

  readAudioFile() {
    var ans_b64 = null
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + '/' + this.fileName, (fileEntry) => {
      fileEntry.file((file) => {
        var reader = new FileReader()
        reader.onloadend = (e: any) => {
          ans_b64 = e.target.result
          this.answer.id = this.questionID
          var displayDate = new Date()
          var date = displayDate.toISOString()
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

}






/***************************

//Checking for platform and if it is not android, audio questions will be skipped, don't show it to user
if (this.platform == false) {
  while (this.questions[this.currentQuestion + value].type == 'audio') {
    this.answer.id = this.questions[this.currentQuestion + value].id
    this.answer.value = 'Platform not supported'
    this.answerService.add(this.answer)
    if (value <= -1) {
      value = value - 1
    } else {
      value = value + 1
    }
    if (this.currentQuestion + value < 0) {
      value = 0
    }
    if (this.currentQuestion + value == this.questions.length) {
      break
    }
  }
}

if ((this.questions[this.currentQuestion].type == 'audio')) {
  this.stopOpensmile()
}

*******************************/
