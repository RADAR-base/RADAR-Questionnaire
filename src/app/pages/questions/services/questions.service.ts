import { Injectable } from '@angular/core'

import { DefaultQuestionsHidden } from '../../../../assets/data/defaultConfig'
import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { RemoteConfigService } from '../../../core/services/config/remote-config.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { ConfigKeys } from '../../../shared/enums/config'
import { ShowIntroductionType } from '../../../shared/models/assessment'
import { Question, QuestionType } from '../../../shared/models/question'
import { parseAndEvalLogic } from '../../../shared/utilities/parsers'
import { getSeconds } from '../../../shared/utilities/time'
import { Utility } from '../../../shared/utilities/util'
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
    private finish: FinishTaskService,
    private remoteConfig: RemoteConfigService,
    private util: Utility
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
    if (assessment.showIntroduction !== ShowIntroductionType.ALWAYS) {
      assessment.showIntroduction = false
      this.questionnaire.updateAssessment(taskType, assessment)
    }
  }

  processQuestions(title, questions: any[]) {
    if (title.includes('ESM28Q'))
      if (new Date().getHours() > 10) return Promise.resolve(questions.slice(1))

    return Promise.resolve(questions)
  }

  isAnswered(question: Question) {
    const id = question.field_name
    return this.answerService.check(id)
  }

  getNextQuestion(questions, currentQuestionId) {
    let qIndex = currentQuestionId + 1
    while (
      qIndex < questions.length &&
      questions[qIndex].branching_logic.length
    ) {
      const answers = this.util.deepCopy(this.answerService.answers)
      if (parseAndEvalLogic(questions[qIndex].branching_logic, answers))
        return qIndex
      qIndex += 1
    }
    return qIndex
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
    const type = task.type
    return this.questionnaire
      .getAssessment(type, task)
      .then(assessment =>
        this.processQuestions(
          assessment.name,
          assessment.questions
        ).then(questions => [assessment, questions])
      )
      .then(([assessment, questions]) => {
        return {
          title: assessment.name,
          introduction: this.localization.chooseText(assessment.startText),
          endText: this.localization.chooseText(assessment.endText),
          questions: questions,
          task: task ? task : assessment,
          assessment: assessment,
          type: type,
          isLastTask: task ? task.isLastTask : false
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
    return this.finish.createClinicalFollowUpTask(assessment)
  }

  getHiddenQuestions(): Promise<Object> {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(ConfigKeys.QUESTIONS_HIDDEN, DefaultQuestionsHidden)
      )
      .then(res => JSON.parse(res))
      .catch(e => DefaultQuestionsHidden)
  }
}
