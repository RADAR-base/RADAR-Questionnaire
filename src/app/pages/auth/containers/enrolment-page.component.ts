import { Component, ElementRef, ViewChild } from '@angular/core'
import { Browser } from '@capacitor/browser'
import { Device } from '@capacitor/device'
import { NavController } from '@ionic/angular'
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
  @ViewChild('swiper')
  slides: ElementRef | undefined;

  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: string
  enterMetaQR = false
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  language?: LanguageSetting = DefaultLanguage
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages

  constructor(
    public navCtrl: NavController,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService
  ) {
    this.init()
  }

  async init() {
    const languageTag = await Device.getLanguageTag()
    // Language value is in BCP 47 format (e.g. en-US)
    const tag = languageTag.value.split('-')[0]
    let lang = this.languagesSelectable.find(a => a.value == tag)
    this.language = lang ? lang : this.language
    this.localization.setLanguage(this.language)
  }

  ionViewDidEnter() {
    this.usage.setPage(this.constructor.name)
    this.slides.nativeElement.swiper.allowSlideNext = false
    this.slides.nativeElement.swiper.allowSlidePrev = false
  }

  next() {
      this.slides.nativeElement.swiper.allowSlideNext = true
      const index = this.slides.nativeElement.swiper.activeIndex
      const slideIndex = index + 1
      this.slides.nativeElement.swiper.slideTo(slideIndex, 500)
      this.slides.nativeElement.swiper.allowSlideNext = false
      this.slides.nativeElement.swiper.allowSlidePrev = false
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
        this.auth.reset()
      })
  }

  handleError(e) {
    this.logger.error('Failed to log in', e)
    this.showStatus()
    this.outcomeStatus =
      e.error && e.error.message
        ? e.error.message
        : e.status
        ? e.statusText + ' (' + e.status + ')'
        : e
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

  async openWithInAppBrowser(url: string) {
    await Browser.open({ url })
  }
}
