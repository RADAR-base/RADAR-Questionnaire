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
import { LocalizationService } from '../misc/localization.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class QuestionnaireService {
  constructor(
    private storage: StorageService,
    private localization: LocalizationService,
    private http: HttpClient
  ) {}

  pullQuestionnaires(storageKey): Promise<Assessment[]> {
    return this.storage.get(storageKey).then(assessments => {
      const localizedQuestionnaires = assessments.map(a =>
        this.pullQuestionnaireLang(a)
      )

      return Promise.all(localizedQuestionnaires).then(res => {
        assessments.forEach((a, i) => {
          a.questions = this.formatQuestionsHeaders(res[i])
        })
        return this.storage.set(storageKey, assessments)
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

  updateAssessments(key: StorageKeys, assessments: Assessment[]) {
    return this.storage
      .set(key, assessments)
      .then(() => this.pullQuestionnaires(key))
  }
}
