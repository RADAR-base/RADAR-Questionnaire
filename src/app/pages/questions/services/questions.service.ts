import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'
import { getSeconds } from '../../../shared/utilities/time'
import { AnswerService } from './answer.service'
import { TimestampService } from './timestamp.service'

@Injectable()
export class QuestionsService {
  constructor(
    public storage: StorageService,
    private answerService: AnswerService,
    private timestampService: TimestampService
  ) {}

  reset() {
    this.answerService.reset()
    this.timestampService.reset()
  }

  deleteLastAnswer() {
    this.answerService.pop()
  }

  submitAnswer(answer) {
    this.answerService.add(answer)
  }

  getData() {
    return {
      answers: this.answerService.answers,
      timestamps: this.timestampService.timestamps
    }
  }

  getTime() {
    return getSeconds({ milliseconds: this.timestampService.getTimeStamp() })
  }

  updateAssessmentIntroduction(assessment) {
    if (assessment.showIntroduction) {
      const assessmentUpdated = assessment
      assessmentUpdated.showIntroduction = false
      this.storage.updateAssessment(assessmentUpdated)
    }
  }

  skipESMSleepQuestion(questionTitle) {
    // Note: First ESM will show sleep question
    const time = new Date()
    if (time.getHours() > 9 && questionTitle === 'ESM') {
      return 1
    }
    return 0
  }

  showESMRatingQuestion(questionTitle, currentQuestionId) {
    // Note: Last ESM will show rating question
    const time = new Date()
    if (questionTitle === 'ESM' && currentQuestionId === 'esm_beep') {
      if (time.getHours() >= 19) {
        return 0
      }
      return 1
    }
    return 0
  }

  checkAnswer(id) {
    return this.answerService.check(id)
  }

  evalSkipNext(questions, currentQuestion) {
    // Note: Evaluates branching logic
    let increment = 1
    let questionIdx = currentQuestion + 1
    if (questionIdx < questions.length) {
      while (questions[questionIdx].evaluated_logic !== '') {
        const responses = Object.assign({}, this.answerService.answers)
        const logic = questions[questionIdx].evaluated_logic
        const logicFieldName = this.getLogicFieldName(logic)
        const answers = this.answerService.answers[logicFieldName]
        const answerLength = answers.length
        if (!answerLength) if (eval(logic) === true) return increment
        for (const answer of answers) {
          responses[logicFieldName] = answer
          if (eval(logic) === true) return increment
        }
        increment += 1
        questionIdx += 1
      }
    }
    return increment
  }

  getLogicFieldName(logic) {
    return logic.split("['")[1].split("']")[0]
  }

  getNextQuestion(questions, currentQuestion, questionTitle) {
    const id = questions[currentQuestion].field_name
    let nextQuestionIncrVal = this.evalSkipNext(questions, currentQuestion)
    nextQuestionIncrVal += this.showESMRatingQuestion(questionTitle, id)
    return nextQuestionIncrVal
  }

  recordTimeStamp(questionId, startTime) {
    this.timestampService.add({
      id: questionId,
      value: {
        startTime: startTime,
        endTime: this.getTime()
      }
    })
  }
}
