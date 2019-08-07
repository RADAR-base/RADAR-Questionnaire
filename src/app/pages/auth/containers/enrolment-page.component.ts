import { Component, ViewChild } from '@angular/core'
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx'
import { NavController, Slides } from 'ionic-angular'

import {
  DefaultLanguage,
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport,
  LanguageMap
} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LogService } from '../../../core/services/misc/log.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../shared/enums/events'
import { LocKeys } from '../../../shared/enums/localisations'
import {
  LanguageSetting,
  WeeklyReportSubSettings
} from '../../../shared/models/settings'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { AuthService } from '../services/auth.service'

@Component({
  selector: 'page-enrolment',
  templateUrl: 'enrolment-page.component.html'
})
export class EnrolmentPageComponent {
  @ViewChild(Slides)
  slides: Slides
  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: String
  enterMetaQR = false
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  language?: LanguageSetting = DefaultLanguage
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService,
  ) {
    this.localization.update().then(lang => (this.language = lang))
  }

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
    this.usage.setPage(this.constructor.name)
  }

  next() {
    this.slides.lockSwipes(false)
    const slideIndex = this.slides.getActiveIndex() + 1
    this.slides.slideTo(slideIndex, 500)
    this.slides.lockSwipes(true)
  }

  enterToken() {
    this.enterMetaQR = true
    this.next()
  }

  scanQRHandler() {
    const scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
    }
    this.scanner.scan(scanOptions).then(res => {
      this.usage.sendGeneralEvent(UsageEventType.QR_SCANNED, {
        text: res.text
      })
      return this.authenticate(res.text)
    })
  }

  metaQRHandler([baseURL, tokenName]) {
    this.authenticate(this.auth.getURLFromToken(baseURL, tokenName))
  }

  authenticate(authObj) {
    this.showOutcomeStatus = false
    this.loading = true
    this.auth
      .authenticate(authObj)
      .catch(
        e =>
          new Promise((resolve, reject) => {
            if (e.status !== 409) reject(e)
            this.handleError(e)
            resolve()
          })
      )
      .then(() => this.auth.initSubjectInformation())
      .then(() => {
        this.usage.sendGeneralEvent(UsageEventType.SIGN_UP)
        this.next()
      })
      .catch(e => {
        this.handleError(e)
        this.loading = false
      })
  }

  handleError(e) {
    this.logger.error('Failed to log in', e)
    this.showOutcomeStatus = true
    this.outcomeStatus =
      e.error && e.error.message
        ? e.error.message
        : e.statusText + ' (' + e.status + ')'
    this.usage.sendGeneralEvent(UsageEventType.SIGN_UP_FAIL, {
      error: this.outcomeStatus
    })
  }

  clearStatus() {
    this.showOutcomeStatus = false
  }

  navigateToSplash() {
    this.navCtrl.setRoot(SplashPageComponent)
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
          const lang: LanguageSetting = {
            label: LanguageMap[selectedLanguageVal],
            value: selectedLanguageVal
          }
          this.localization.setLanguage(lang).then(() => {
            this.language = lang
            return this.navCtrl.setRoot(EnrolmentPageComponent)
          })
        }
      }
    ]
    const inputs = this.languagesSelectable.map(lang => ({
      type: 'radio',
      label: this.localization.translate(lang.label),
      value: lang.value,
      checked: lang.value === this.language.value
    }))
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SETTINGS_LANGUAGE_ALERT),
      buttons: buttons,
      inputs: inputs
    })
  }
}
