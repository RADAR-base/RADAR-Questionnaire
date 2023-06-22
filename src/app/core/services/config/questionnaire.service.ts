import { Injectable } from '@angular/core'
import * as urljoin from 'url-join'

import {
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI,
  GIT_API_URI
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  Assessment,
  AssessmentType,
  QuestionnaireMetadata
} from '../../../shared/models/assessment'
import { Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { Utility } from '../../../shared/utilities/util'
import { GithubClient } from '../misc/github-client.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class QuestionnaireService {
  private readonly QUESTIONNAIRE_STORE = {
    CONFIG_ASSESSMENTS: StorageKeys.CONFIG_ASSESSMENTS,
    CONIFG_ON_DEMAND_ASSESSMENTS: StorageKeys.CONFIG_ON_DEMAND_ASSESSMENTS,
    CONFIG_CLINICAL_ASSESSMENTS: StorageKeys.CONFIG_CLINICAL_ASSESSMENTS
  }
  LANG_EN = 'en'

  constructor(
    private storage: StorageService,
    private localization: LocalizationService,
    private githubClient: GithubClient,
    private util: Utility,
    private logger: LogService
  ) {}

  pullDefinitionsForQuestionnaires(assessments: Assessment[]) {
    // NOTE: Update assessment list from protocol
    return Promise.all(
      this.util.deepCopy(assessments).map(a => {
        return this.pullDefinitionForSingleQuestionnaire(a)
          .then(assessment =>
            this.addToAssessments(assessment.type, assessment)
          )
          .catch(e => {
            throw this.logger.error(
              'Failed to update ' + a.name + ' assessment',
              e
            )
          })
      })
    )
  }

  pullDefinitionForSingleQuestionnaire(
    assessment: Assessment
  ): Promise<Assessment> {
    assessment.questionnaire = Object.assign(assessment.questionnaire, {
      type: DefaultQuestionnaireTypeURI,
      format: DefaultQuestionnaireFormatURI
    })
    const language = this.localization.getLanguage().value
    let uri = this.formatQuestionnaireUri(assessment.questionnaire, language)
    assessment.type = assessment.type
      ? assessment.type
      : this.getAssessmentTypeFromAssessment(assessment)
    return this.githubClient
      .getContent(uri)
      .catch(e => {
        this.logger.error(`Failed to get questionnaires from ${uri}`, e)
        uri = this.formatQuestionnaireUri(
          assessment.questionnaire,
          this.LANG_EN
        )
        return this.githubClient.getContent(uri) as Promise<Question[]>
      })
      .then(translated => {
        assessment.questions = this.formatQuestionsHeaders(translated)
        if (assessment.protocol.clinicalProtocol)
          assessment.requiresInClinicCompletion =
            assessment.protocol.clinicalProtocol.requiresInClinicCompletion
        return assessment
      })
  }

  formatQuestionnaireUri(metadata: QuestionnaireMetadata, lang: string) {
    // NOTE: This parses the URL supplied in the protocol file.
    const urlParts = metadata.repository.split('://')[1].split('/')
    const questionnaireName = metadata.name
    const organization = urlParts[1],
      repo = urlParts[2],
      branch = urlParts[3],
      directory = urlParts.slice(4).join('/')
    const suffix = lang.length && lang != this.LANG_EN ? `_${lang}` : ''
    const fileName =
      questionnaireName + metadata.type + suffix + metadata.format
    return (
      urljoin(
        GIT_API_URI,
        organization,
        repo,
        'contents',
        directory,
        questionnaireName,
        fileName
      ) +
      '?ref=' +
      branch
    )
  }

  formatQuestionsHeaders(questions) {
    questions.forEach((q, i) => {
      if (
        i > 0 &&
        !q.section_header &&
        q.matrix_group_name == questions[i - 1].matrix_group_name
      ) {
        q.section_header = questions[i - 1].section_header
      }
    })
    return questions
  }

  getAssessmentTypeFromAssessment(a: Assessment) {
    if (
      a.type == AssessmentType.SCHEDULED ||
      (!a.type && !a.protocol.clinicalProtocol)
    )
      return AssessmentType.SCHEDULED

    if (a.type == AssessmentType.ON_DEMAND || a.protocol.onDemandProtocol)
      return AssessmentType.ON_DEMAND

    if (
      a.type == AssessmentType.CLINICAL ||
      (!a.type && a.protocol.clinicalProtocol)
    )
      return AssessmentType.CLINICAL
  }

  updateAssessment(type: AssessmentType, assessment: Assessment) {
    return this.getAssessments(type).then(assessments => {
      if (!assessments) assessments = []
      const index = assessments.findIndex(a => a.name == assessment.name)
      if (index != -1) {
        assessments[index] = this.util.deepCopy(assessment)
        return this.setAssessments(type, assessments)
      }
    })
  }

  getAssessmentForTask(type: AssessmentType, task: Task) {
    return this.getAssessments(type).then(assessments =>
      assessments.find(a => a.name === task.name)
    )
  }

  getAssessments(type) {
    const key = this.getKeyFromTaskType(type)
    return this.storage.get(key)
  }

  setAssessments(type, assessments) {
    const key = this.getKeyFromTaskType(type)
    return this.storage.set(key, assessments)
  }

  addToAssessments(type, assessment) {
    return this.getAssessments(type).then(assessments => {
      if (!assessments) assessments = []
      const index = assessments.findIndex(a => a.name == assessment.name)
      if (index > -1) assessments[index] = assessment
      else assessments.push(assessment)
      return this.setAssessments(type, assessments)
    })
  }

  getKeyFromTaskType(type: AssessmentType) {
    switch (type) {
      case AssessmentType.ON_DEMAND:
        return this.QUESTIONNAIRE_STORE.CONIFG_ON_DEMAND_ASSESSMENTS
      case AssessmentType.CLINICAL:
        return this.QUESTIONNAIRE_STORE.CONFIG_CLINICAL_ASSESSMENTS
      case AssessmentType.SCHEDULED:
      default:
        return this.QUESTIONNAIRE_STORE.CONFIG_ASSESSMENTS
    }
  }

  getHasOnDemandAssessments() {
    return this.storage
      .get(this.QUESTIONNAIRE_STORE.CONIFG_ON_DEMAND_ASSESSMENTS)
      .then(assessments => assessments && assessments.length > 0)
  }

  getHasClinicalAssessments() {
    return this.storage
      .get(this.QUESTIONNAIRE_STORE.CONFIG_CLINICAL_ASSESSMENTS)
      .then(assessments => assessments.length > 0)
  }

  reset() {
    return Promise.all([
      this.setAssessments(AssessmentType.ON_DEMAND, []),
      this.setAssessments(AssessmentType.CLINICAL, []),
      this.setAssessments(AssessmentType.SCHEDULED, [])
    ])
  }
}
