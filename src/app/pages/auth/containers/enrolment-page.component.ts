import { Component, ViewChild } from '@angular/core'
import {
  InAppBrowser,
  InAppBrowserOptions
} from '@awesome-cordova-plugins/in-app-browser/ngx'
import { Globalization } from '@ionic-native/globalization/ngx'
import { IonSlides, NavController } from '@ionic/angular'
import { AlertInput } from '@ionic/core'

import {
  DefaultLanguage,
  DefaultPrivacyPolicyUrl,
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LogService } from '../../../core/services/misc/log.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import {
  EnrolmentEventType,
  UsageEventType
} from '../../../shared/enums/events'
import { LocKeys } from '../../../shared/enums/localisations'
import {
  LanguageSetting,
  WeeklyReportSubSettings
} from '../../../shared/models/settings'
import { AuthService } from '../services/auth.service'

@Component({
  selector: 'page-enrolment',
  templateUrl: 'enrolment-page.component.html',
  styleUrls: ['./enrolment-page.component.scss']
})
export class EnrolmentPageComponent {
  @ViewChild(IonSlides, { static: true }) slides: IonSlides
  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: string
  enterMetaQR = false
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  language?: LanguageSetting = DefaultLanguage
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages
  browserOptions: InAppBrowserOptions = {
    location: 'yes',
    hidenavigationbuttons: 'yes',
    hideurlbar: 'yes',
    toolbarcolor: '#6d9aa5',
    closebuttoncolor: '#ffffff'
  }

  constructor(
    public navCtrl: NavController,
    private theInAppBrowser: InAppBrowser,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService,
    private globalization: Globalization
  ) {
    this.auth.reset()
    this.globalization.getPreferredLanguage().then(res => {
      // Language value is in BCP 47 format (e.g. en-US)
      const tag = res.value.split('-')[0]
      let lang = this.languagesSelectable.find(a => a.value == tag)
      this.language = lang ? lang : this.language
      this.localization.setLanguage(this.language)
    })
  }

  ionViewDidEnter() {
    this.usage.setPage(this.constructor.name)
    this.slides.lockSwipes(true)
  }

  next() {
    Promise.all([
      this.slides.lockSwipes(false),
      this.slides.getActiveIndex()
    ]).then(([, index]) => {
      const slideIndex = index + 1
      this.slides.slideTo(slideIndex, 500)
      this.slides.lockSwipes(true)
    })
  }

  enterToken() {
    this.enterMetaQR = true
    this.next()
  }

  authenticate(authObj) {
    if (!this.enterMetaQR)
      this.usage.sendGeneralEvent(UsageEventType.QR_SCANNED)
    this.loading = true
    this.clearStatus()
    this.auth
      .authenticate(authObj)
      .catch(e => {
        if (e.status !== 409) throw e
      })
      .then(() => this.auth.initSubjectInformation())
      .then(() => {
        this.usage.sendGeneralEvent(EnrolmentEventType.SUCCESS)
        this.next()
      })
      .catch(e => {
        this.handleError(e)
        this.loading = false
      })
  }

  handleError(e) {
    this.logger.error('Failed to log in', e)
    this.showStatus()
    this.outcomeStatus =
      e.error && e.error.message
        ? e.error.message
        : e.statusText + ' (' + e.status + ')'
    this.usage.sendGeneralEvent(
      e.status == 409 ? EnrolmentEventType.ERROR : EnrolmentEventType.FAIL,
      false,
      {
        error: this.outcomeStatus
      }
    )
  }

  clearStatus() {
    this.showOutcomeStatus = false
  }

  showStatus() {
    setTimeout(() => (this.showOutcomeStatus = true), 500)
  }

  navigateToSplash() {
    this.navCtrl.navigateRoot('/')
  }

  showSelectLanguage() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_CANCEL),
        handler: () => {}
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_SET),
        handler: selectedLanguageVal => {
          const lang = JSON.parse(selectedLanguageVal)
          this.localization.setLanguage(lang).then(() => {
            this.language = lang
            return this.navigateToSplash()
          })
        }
      }
    ]
    const inputs = this.languagesSelectable.map(
      lang =>
        ({
          type: 'radio',
          label: this.localization.translate(lang.label),
          value: JSON.stringify(lang),
          checked: lang.value === this.language.value
        } as AlertInput)
    )
    return this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.SETTINGS_LANGUAGE_ALERT),
      buttons: buttons,
      inputs: inputs
    })
  }

  showPrivacyPolicy() {
    console.log('Opening privacy policy..')
    this.openWithInAppBrowser(DefaultPrivacyPolicyUrl)
  }

  openWithInAppBrowser(url: string) {
    this.theInAppBrowser.create(url, '_blank', this.browserOptions)
  }
}
