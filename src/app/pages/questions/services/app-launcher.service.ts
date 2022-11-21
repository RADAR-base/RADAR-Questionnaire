import { Injectable } from '@angular/core'
import { AppLauncher, AppLauncherOptions } from '@ionic-native/app-launcher/ngx'
import { Insomnia } from '@ionic-native/insomnia/ngx'
import { Platform } from '@ionic/angular'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LogService } from '../../../core/services/misc/log.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { ExternalApp, Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { QuestionsService } from './questions.service'

@Injectable({
  providedIn: 'root'
})
export class AppLauncherService {
  constructor(
    private questionsService: QuestionsService,
    private usage: UsageService,
    private platform: Platform,
    private insomnia: Insomnia,
    private localization: LocalizationService,
    private appLauncher: AppLauncher,
    private alertService: AlertService,
    private logger: LogService
  ) {}

  removeLaunchAppFromQuestions(questions: Question[]): Question[] {
    return questions.filter(q => q.field_type != 'launcher')
  }

  getLaunchApp(questions: Question[]): ExternalApp {
    const launchApps = questions.filter(q => q.field_type == 'launcher')
    return launchApps.length > 0 ? launchApps[0] : null
  }

  isExternalAppUriValidForThePlatform(externalApp: ExternalApp): boolean {
    if (!externalApp) {
      return false
    }
    if (this.platform.is('ios')) {
      if (!externalApp.external_app_ios_uri) {
        return false
      }
    } else if (this.platform.is('android')) {
      if (!externalApp.external_app_android_uri) {
        return false
      }
    } else {
      return false
    }
    return true
  }

  getAppLauncherOptions(externalApp: ExternalApp, task: Task) {
    const options: AppLauncherOptions = {}

    if (!externalApp) {
      return options
    }

    if (this.platform.is('ios')) {
      options.uri = externalApp.external_app_ios_uri
    } else {
      options.uri = externalApp.external_app_android_uri
    }

    if (options.uri.toString().includes('?')) {
      options.uri += '&'
    } else {
      options.uri += '?'
    }

    options.uri += 'timestamp=' + task.timestamp

    return options
  }

  launchApp(externalApp: Question, task: Task) {
    if (!externalApp) return

    return this.appLauncher
      .launch(this.getAppLauncherOptions(externalApp, task))
      .then(
        () => {
          console.log('App launched')
        },
        err => {
          console.log('Error in launching app', err)
          this.showAlertOnAppLaunchError(externalApp)
        }
      )
  }

  showAlertOnAppLaunchError(externalApp: ExternalApp) {
    if (!externalApp) return

    this.alertService
      .showAlert({
        header: this.localization.translateKey(
          LocKeys.EXTERNAL_APP_FAILURE_ON_LAUNCH_TITLE
        ),
        message:
          (externalApp.external_app_name
            ? externalApp.external_app_name
            : 'App') +
          ' ' +
          this.localization.translateKey(
            LocKeys.EXTERNAL_APP_FAILURE_ON_LAUNCH_DESC
          ),
        buttons: [
          {
            text: this.localization.translateKey(LocKeys.BTN_DISMISS),
            handler: () => {}
          }
        ]
      })
      .then(_ => {})
  }
}
