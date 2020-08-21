import { Injectable } from '@angular/core'

import { DefaultOnDemandAssessmentLabel } from '../../../../assets/data/defaultConfig'
import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { RemoteConfigService } from '../../../core/services/config/remote-config.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { ConfigKeys } from '../../../shared/enums/config'
import { AssessmentType } from '../../../shared/models/assessment'

@Injectable()
export class OnDemandService {
  title: Promise<string>

  constructor(
    public questionnaire: QuestionnaireService,
    private remoteConfig: RemoteConfigService,
    private localization: LocalizationService
  ) {}

  getAssessements() {
    return this.questionnaire.getAssessments(AssessmentType.ON_DEMAND)
  }

  getOnDemandPageLabel() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.ON_DEMAND_ASSESSMENT_LABEL,
          DefaultOnDemandAssessmentLabel
        )
      )
      .then(res => this.localization.chooseText(JSON.parse(res)))
  }
}
