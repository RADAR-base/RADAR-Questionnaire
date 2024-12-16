import { Injectable } from '@angular/core'

import {
  DefaultAutoNextQuestionnaireTypes,
  DefaultShowTaskProgressCount,
  DefaultSkippableQuestionnaireTypes
} from '../../../../assets/data/defaultConfig'
import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { RemoteConfigService } from '../../../core/services/config/remote-config.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { ConfigKeys } from '../../../shared/enums/config'
import { ShowIntroductionType } from '../../../shared/models/assessment'
import {
  Question,
  QuestionPosition,
  QuestionType
} from '../../../shared/models/question'
import { parseAndEvalLogic } from '../../../shared/utilities/parsers'
import { getSeconds } from '../../../shared/utilities/time'
import { Utility } from '../../../shared/utilities/util'
import { AnswerService } from './answer.service'
import { TimestampService } from './timestamp.service'
import { DefaultQuestionnaireProcessorService } from './questionnaire-processor/default-questionnaire-processor.service'
import { HealthQuestionnaireProcessorService } from './questionnaire-processor/health-questionnaire-processor.service'
import { QuestionnaireProcessorService } from './questionnaire-processor/questionnaire-processor.service'

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  PREVIOUS_BUTTON_DISABLED_SET: Set<QuestionType> = new Set([
    QuestionType.timed,
    QuestionType.audio
  ])
  NEXT_BUTTON_ENABLED_SET: Set<QuestionType> = new Set(
    DefaultSkippableQuestionnaireTypes
  )
  NEXT_BUTTON_AUTOMATIC_SET: Set<QuestionType> = new Set(
    DefaultAutoNextQuestionnaireTypes
  )
  DELIMITER = ','
  isProgressCountShown = false
  questionnaireProcessor: any

  constructor(
    public questionnaire: QuestionnaireService,
    private answerService: AnswerService,
    private timestampService: TimestampService,
    private localization: LocalizationService,
    private defaultQuestionnaireProcessor: DefaultQuestionnaireProcessorService,
    private healthProcessor: HealthQuestionnaireProcessorService,
    private remoteConfig: RemoteConfigService,
    private util: Utility
  ) {
    this.questionnaireProcessor = this.defaultQuestionnaireProcessor
  }

  initRemoteConfigParams() {
    return this.remoteConfig
      .read()
      .then(config =>
        Promise.all([
          config.getOrDefault(
            ConfigKeys.AUTO_NEXT_QUESTIONNAIRE_TYPES,
            DefaultAutoNextQuestionnaireTypes.toString()
          ),
          config.getOrDefault(
            ConfigKeys.SKIPPABLE_QUESTIONNAIRE_TYPES,
            DefaultSkippableQuestionnaireTypes.toString()
          )
        ])
      )
      .then(([autoNextSet, skippableSet]) => {
        if (autoNextSet.length)
          this.NEXT_BUTTON_AUTOMATIC_SET = new Set(
            this.stringToArray(autoNextSet, this.DELIMITER)
          )
        if (skippableSet.length)
          this.NEXT_BUTTON_ENABLED_SET = new Set(
            this.stringToArray(skippableSet, this.DELIMITER)
          )
      })
  }

  reset() {
    this.answerService.reset()
    this.timestampService.reset()
    this.questionnaireProcessor = this.defaultQuestionnaireProcessor
  }

  deleteLastAnswer() {
    this.answerService.pop()
  }

  deleteLastAnswers(questions: Question[]) {
    const questionKeys = questions.map(q => q.field_name)
    this.answerService.keys = this.answerService.keys.filter(
      k => !questionKeys.includes(k)
    )
  }

  submitAnswer(answer) {
    this.answerService.add(answer)
  }

  getData(questions) {
    const answers = this.getAnswers()
    const timestamps = this.timestampService.timestamps
    return {
      answers,
      timestamps,
      time: this.getTimeStart(questions, answers, timestamps),
      timeCompleted: this.getTimeCompleted(answers, timestamps)
    }
  }

  getAttemptedAnswers() {
    return this.answerService.answers
  }

  getAnswers() {
    const answers = {}
    const timestamps = this.timestampService.timestamps
    this.answerService.keys.map(d =>
      timestamps[d] ? (answers[d] = this.answerService.answers[d]) : []
    )
    return answers
  }

  getTimeStart(questions, answers, timestamps) {
    // NOTE: Do not include info screen as start time
    const index = questions.findIndex(
      q => q.field_type !== QuestionType.info && answers[q.field_name]
    )
    const firstKey =
      index > -1 ? questions[index].field_name : questions[0].field_name
    return timestamps[firstKey].startTime
  }

  getTimeCompleted(answers, timestamps) {
    const answerKeys = Object.keys(answers)
    const lastKey = answerKeys[answerKeys.length - 1]
    return timestamps[lastKey].endTime
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

  processQuestions(title, questions: Question[]) {
    return questions.map(q =>
      Object.assign(q, { isAutoNext: this.getIsNextAutomatic(q.field_type) })
    )
  }

  isAnswered(question: Question) {
    const id = question.field_name
    return this.answerService.check(id)
  }

  isAnyAnswered(questions: Question[]) {
    return questions.some(q => this.isAnswered(q))
  }

  getNextQuestion(groupedQuestions, currentQuestionId): QuestionPosition {
    let qIndex = currentQuestionId + 1
    const groupKeys: string[] = Array.from(groupedQuestions.keys())
    const questionIndices = []

    while (qIndex < groupKeys.length) {
      const groupQuestions = groupedQuestions.get(groupKeys[qIndex])
      const answers = this.util.deepCopy(this.answerService.answers)
      groupQuestions.forEach((q, i) => {
        if (
          this.isNotNullOrEmpty(
            groupedQuestions.get(groupKeys[qIndex])[i].branching_logic
          )
        ) {
          if (parseAndEvalLogic(q.branching_logic, answers))
            questionIndices.push(i)
        } else questionIndices.push(i)
      })
      if (questionIndices.length)
        return {
          groupKeyIndex: qIndex,
          questionIndices: questionIndices
        }

      qIndex += 1
    }
    return {
      groupKeyIndex: qIndex,
      questionIndices: questionIndices
    }
  }

  isNotNullOrEmpty(value) {
    return value && value.length && value != ''
  }

  getAttemptProgress(total) {
    const answers = this.answerService.answers
    const attemptedAnswers = Object.keys(answers)
      .map(d => (answers[d] ? answers[d] : null))
      .filter(a => a)
    return Math.ceil((attemptedAnswers.length * 100) / total)
  }

  getProgress() {
    return this.questionnaireProcessor.getProgress()
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

  getIsAnyPreviousEnabled(questions: Question[]) {
    // NOTE: This checks if any question in the array has previous button enabled
    return questions.some(q => this.getIsPreviousDisabled(q.field_type))
  }

  getIsNextEnabled(questionType: string) {
    return this.NEXT_BUTTON_ENABLED_SET.has(questionType)
  }

  getIsAnyNextEnabled(questions: Question[]) {
    // NOTE: This checks if any question in the array has next button enabled
    return questions.some(q => this.getIsNextEnabled(q.field_type))
  }

  getIsNextAutomatic(questionType: string) {
    return this.NEXT_BUTTON_AUTOMATIC_SET.has(questionType)
  }

  getQuestionnairePayload(task) {
    const type = task.type
    return this.questionnaire
      .getAssessmentForTask(type, task)
      .then(assessment => {
        const questions = this.processQuestions(
          assessment.name,
          assessment.questions
        )
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
    const type = task.type
    this.initQuestionnaireProcessor(task.name)
    return this.questionnaire
      .getAssessmentForTask(type, task)
      .then(assessment =>
        this.questionnaireProcessor.process(
          this.getData(questions),
          task,
          assessment.questionnaire
        )
      )
  }

  initQuestionnaireProcessor(name) {
    if (name.toLowerCase().includes('health')) {
      this.questionnaireProcessor = this.healthProcessor
    } else {
      this.questionnaireProcessor = this.defaultQuestionnaireProcessor
    }
  }

  stringToArray(array, delimiter) {
    return array.split(delimiter).map(s => s.trim())
  }

  getIsProgressCountShown() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.SHOW_TASK_PROGRESS_COUNT,
          DefaultShowTaskProgressCount
        )
      )
      .then(res => JSON.parse(res))
  }
}
