import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  ARMTDefBranchProd,
  ARMTDefBranchTest,
  TEST_ARMT_DEF
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { Assessment } from '../../../shared/models/assessment'
import { Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { TaskType } from '../../../shared/utilities/task-type'
import { Utility } from '../../../shared/utilities/util'
import { LocalizationService } from '../misc/localization.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class QuestionnaireService {
  private readonly QUESTIONNAIRE_STORE = {
    CONFIG_ASSESSMENTS: StorageKeys.CONFIG_ASSESSMENTS,
    CONFIG_CLINICAL_ASSESSMENTS: StorageKeys.CONFIG_CLINICAL_ASSESSMENTS,
    HAS_CLINICAL_TASKS: StorageKeys.HAS_CLINICAL_TASKS
  }

  constructor(
    private storage: StorageService,
    private localization: LocalizationService,
    private http: HttpClient,
    private util: Utility
  ) {}

  pullQuestionnaires(type: TaskType): Promise<Assessment[]> {
    return this.getAssessments(type).then(assessments => {
      const localizedQuestionnaires = assessments.map(a =>
        this.pullQuestionnaireLang(a)
      )
      return Promise.all(localizedQuestionnaires).then(res => {
        assessments.forEach((a, i) => {
          a.questions = this.formatQuestionsHeaders(res[i])
        })
        return this.setAssessments(type, assessments)
      })
    })
  }

  pullQuestionnaireLang(assessment): Promise<Object> {
    const uri = this.formatQuestionnaireUri(
      assessment.questionnaire,
      this.localization.getLanguage().value
    )
    return this.getQuestionnairesOfLang(uri).catch(e => {
      const URI = this.formatQuestionnaireUri(assessment.questionnaire, '')
      return this.getQuestionnairesOfLang(URI)
    })
  }

  formatQuestionnaireUri(questionnaireRepo, langVal: string) {
    // NOTE: Using temp test repository for aRMT defs
    const repository = TEST_ARMT_DEF
      ? questionnaireRepo.repository.replace(
          ARMTDefBranchProd,
          ARMTDefBranchTest
        )
      : questionnaireRepo.repository
    let uri = repository + questionnaireRepo.name + '/'
    uri += questionnaireRepo.name + questionnaireRepo.type
    if (langVal !== '') {
      uri += '_' + langVal
    }
    uri += questionnaireRepo.format
    console.log(uri)
    return uri
  }

  getQuestionnairesOfLang(URI): Promise<Question[]> {
    return this.http
      .get(URI)
      .toPromise()
      .then(res => {
        if (res instanceof Array) {
          return Promise.resolve(res)
        } else {
          return Promise.reject({
            message: 'URL does not contain an array of questions'
          })
        }
      }) as Promise<Question[]>
  }

  formatQuestionsHeaders(questions) {
    questions.forEach((q, i) => {
      if (!q.section_header && i > 0) {
        q.section_header = questions[i - 1].section_header
      }
    })
    return questions
  }

  updateAssessments(type: TaskType, assessments: Assessment[]) {
    switch (type) {
      case TaskType.ALL:
        const {
          negative: scheduledAssessments,
          positive: clinicalAssessments
        } = this.util.partition(assessments, a => a.protocol.clinicalProtocol)
        return Promise.all([
          this.setHasClinicalTasks(clinicalAssessments.length > 0),
          this.updateAssessments(TaskType.CLINICAL, clinicalAssessments),
          this.updateAssessments(TaskType.NON_CLINICAL, scheduledAssessments)
        ])
      default:
        return this.setAssessments(type, assessments).then(() =>
          this.pullQuestionnaires(type)
        )
    }
  }

  updateAssessment(type: TaskType, assessment: Assessment) {
    console.log('updating assessment')
    return this.getAssessments(type).then(assessments => {
      assessments.find(a => a.name == assessment.name).replace(assessment)
      return this.setAssessments(type, assessments)
    })
  }

  getAssessment(type: TaskType, task: Task) {
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

  getKeyFromTaskType(type: TaskType) {
    switch (type) {
      case TaskType.CLINICAL:
        return this.QUESTIONNAIRE_STORE.CONFIG_CLINICAL_ASSESSMENTS
      default:
        return this.QUESTIONNAIRE_STORE.CONFIG_ASSESSMENTS
    }
  }

  setHasClinicalTasks(value) {
    return this.storage.set(this.QUESTIONNAIRE_STORE.HAS_CLINICAL_TASKS, value)
  }

  getHasClinicalTasks() {
    return this.storage.get(this.QUESTIONNAIRE_STORE.HAS_CLINICAL_TASKS)
  }
}
