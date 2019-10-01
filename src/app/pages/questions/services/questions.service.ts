import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { Question, QuestionType } from '../../../shared/models/question'
import { getTaskType } from '../../../shared/utilities/task-type'
import { getSeconds } from '../../../shared/utilities/time'
import { AnswerService } from './answer.service'
import { FinishTaskService } from './finish-task.service'
import { TimestampService } from './timestamp.service'

@Injectable()
export class QuestionsService {
  PREVIOUS_BUTTON_DISABLED_SET: Set<QuestionType> = new Set([
    QuestionType.timed,
    QuestionType.audio
  ])
  NEXT_BUTTON_ENABLED_SET: Set<QuestionType> = new Set([QuestionType.audio])
  NEXT_BUTTON_AUTOMATIC_SET: Set<QuestionType> = new Set([
    QuestionType.timed,
    QuestionType.audio
  ])

  constructor(
    public questionnaire: QuestionnaireService,
    private answerService: AnswerService,
    private timestampService: TimestampService,
    private localization: LocalizationService,
    private finish: FinishTaskService
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

  getTime() {
    return getSeconds({ milliseconds: this.timestampService.getTimeStamp() })
  }

  updateAssessmentIntroduction(assessment, taskType) {
    if (assessment.showIntroduction) {
      assessment.showIntroduction = false
      this.questionnaire.updateAssessment(taskType, assessment)
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

  processQuestions(title, questions: any[]) {
    if (this.isESM(title)) {
      const length = questions.length
      const first = this.showESMSleepQuestion() ? 0 : 1
      const last = this.showESMRatingQuestion() ? length - 1 : length - 2
      return questions.slice(first, last)
    }
    return questions
  }

  isAnswered(question: Question) {
    const id = question.field_name
    return this.answerService.check(id)
  }

  evalSkipNext(questions, currentQuestion) {
    // NOTE: Evaluates branching logic
    let questionIdx = currentQuestion + 1
    if (questionIdx < questions.length) {
      while (questions[questionIdx].evaluated_logic !== '') {
        const responses = Object.assign({}, this.answerService.answers)
        const logic = questions[questionIdx].evaluated_logic
        const logicFieldName = this.getLogicFieldName(logic)
        const answers = this.answerService.answers[logicFieldName]
        const answerLength = answers.length
        if (!answerLength) if (eval(logic) === true) return questionIdx
        for (const answer of answers) {
          responses[logicFieldName] = answer
          if (eval(logic) === true) return questionIdx
        }
        questionIdx += 1
      }
    }
    return questionIdx
  }

  getLogicFieldName(logic) {
    return logic.split("['")[1].split("']")[0]
  }

  getNextQuestion(questions, currentQuestion) {
    return this.evalSkipNext(questions, currentQuestion)
  }

  getAttemptProgress(total) {
    const answers = this.answerService.answers
    const attemptedAnswers = Object.keys(answers)
      .map(d => (answers[d] ? answers[d] : null))
      .filter(a => a)
    return Math.ceil((attemptedAnswers.length * 100) / total)
  }

  recordTimeStamp(question, startTime) {
    const id = question.field_name
    this.timestampService.add({
      id: id,
      value: {
        startTime: startTime,
        endTime: this.getTime()
      }
    })
  }

  getIsPreviousDisabled(questionType: string) {
    return this.PREVIOUS_BUTTON_DISABLED_SET.has(questionType)
  }

  getIsNextEnabled(questionType: string) {
    return this.NEXT_BUTTON_ENABLED_SET.has(questionType)
  }

  getIsNextAutomatic(questionType: string) {
    return this.NEXT_BUTTON_AUTOMATIC_SET.has(questionType)
  }

  getQuestionnairePayload(task) {
    const type = getTaskType(task)
    return this.questionnaire.getAssessment(type, task).then(assessment => {
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: this.processQuestions(assessment.name, assessment.questions),
        task: task ? task : assessment,
        assessment: assessment,
        type: type,
        isLastTask: false
      }
    })
  }

  processCompletedQuestionnaire(task, questions): Promise<any> {
    const data = this.getData()
    return Promise.all([
      this.finish.updateTaskToComplete(task),
      this.finish.processDataAndSend(
        data.answers,
        questions,
        data.timestamps,
        task
      )
    ])
  }

  handleClinicalFollowUp(assessment, completedInClinic?) {
    if (!completedInClinic) return Promise.resolve()
    return this.finish.evalClinicalFollowUpTask(assessment)
  }
}
