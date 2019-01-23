import { Injectable } from '@angular/core'

import { KAFKA_COMPLETION_LOG } from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { StorageService } from '../../../core/services/storage.service'
import { getSeconds } from '../../../shared/utilities/time'
import { AnswerService } from './answer.service'
import { TimestampService } from './timestamp.service'

@Injectable()
export class QuestionsService {
  constructor(
    public storage: StorageService,
    private answerService: AnswerService,
    private timestampService: TimestampService,
    private kafka: KafkaService
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
      answers: this.getAnswers(),
      timestamps: this.timestampService.timestamps
    }
  }

  getAttemptedAnswers() {
    return this.answerService.answers
  }

  getAnswers() {
    const answers = {}
    this.answerService.keys.map(
      d => (answers[d] = this.answerService.answers[d])
    )
    return answers
  }

  getCompletionPercent(questions) {
    return (
      (100 * Object.keys(this.getAttemptedAnswers()).length) / questions.length
    )
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

  showESMSleepQuestion() {
    // Note: First ESM will show sleep question
    return new Date().getHours() <= 9
  }

  showESMRatingQuestion() {
    // Note: Last ESM will show rating question
    // TODO: Fix hardcoded values
    return new Date().getHours() >= 19
  }

  isESM(title) {
    return title === 'ESM'
  }

  getQuestions(title, questions: any[]) {
    if (this.isESM(title)) {
      const length = questions.length
      const first = this.showESMSleepQuestion() ? 0 : 1
      const last = this.showESMRatingQuestion() ? length - 1 : length - 2
      return questions.slice(first, last)
    }
    return questions
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

  getNextQuestion(questions, currentQuestion) {
    return this.evalSkipNext(questions, currentQuestion)
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

  sendCompletionLog(questions, task) {
    this.kafka.prepareKafkaObjectAndSend(KAFKA_COMPLETION_LOG, {
      task: task,
      percentage: this.getCompletionPercent(questions),
      time: new Date().getTime()
    })
  }
}
