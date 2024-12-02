import { Component, ElementRef, ViewChild } from '@angular/core'
import { App } from '@capacitor/app'
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
  slides: ElementRef | undefined

  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: string
  enterMetaQR = false
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  language?: LanguageSetting = DefaultLanguage
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages
  enrolmentMethod = 'qr'

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
    this.initializeDeepLinking()
  }

  ionViewDidEnter() {
    this.usage.setPage(this.constructor.name)
    this.slides.nativeElement.swiper.allowSlideNext = false
    this.slides.nativeElement.swiper.allowSlidePrev = false
  }

  next() {
    // Check if swiper instance is available before proceeding
    if (
      this.slides &&
      this.slides.nativeElement &&
      this.slides.nativeElement.swiper
    ) {
      // Force swiper to update in case of any sync issues
      this.slides.nativeElement.swiper.update()

      // Allow sliding to the next slide temporarily
      this.slides.nativeElement.swiper.allowSlideNext = true

      // Calculate the next slide index
      const currentIndex = this.slides.nativeElement.swiper.activeIndex
      const nextIndex = currentIndex + 1

      // Attempt to slide to the next slide with a delay for stability
      setTimeout(() => {
        this.slides.nativeElement.swiper
          .slideTo(nextIndex, 500)
          .then(() => {
            // Disable sliding after moving to the next slide
            this.slides.nativeElement.swiper.allowSlideNext = false
            this.slides.nativeElement.swiper.allowSlidePrev = false
          })
          .catch(error => {
            console.warn('Slide transition failed:', error)
            // Retry the slide transition if it fails
            this.retrySlideTransition(nextIndex)
          })
      }, 100) // Adjust delay as necessary
    } else {
      console.warn('Swiper instance not ready, retrying...')
      // Retry if swiper instance isn't available yet
      setTimeout(() => this.next(), 100)
    }
  }

  goToSlideById(id: string) {
    const slides = Array.from(document.querySelectorAll('swiper-slide'))
    const slideIndex = slides.findIndex(slide => slide.id === id)
    if (slideIndex !== -1) {
      this.slides.nativeElement.swiper.allowSlideNext = true
      this.slides.nativeElement.swiper
        .slideTo(slideIndex)
        .then(() => (this.slides.nativeElement.swiper.allowSlideNext = false))
    }
  }

  retrySlideTransition(targetIndex: number) {
    if (
      this.slides &&
      this.slides.nativeElement &&
      this.slides.nativeElement.swiper
    ) {
      this.slides.nativeElement.swiper.update() // Ensure swiper is updated
      this.slides.nativeElement.swiper
        .slideTo(targetIndex, 500)
        .then(() => {
          // Disable sliding after moving to the target slide
          this.slides.nativeElement.swiper.allowSlideNext = false
          this.slides.nativeElement.swiper.allowSlidePrev = false
        })
        .catch(error =>
          console.warn('Retry failed for slide transition:', error)
        )
    }
  }

  enrol(method) {
    this.enrolmentMethod = method
    this.next()
  }

  authenticate(authObj) {
    this.loading = true
    this.clearStatus()
    this.auth
      .authenticate(authObj)
      .catch(e => {
        if (e.status !== 409) throw e // Handle conflict error (409)
      })
      .then(() => this.handleAuthenticationSuccess())
      .catch(e => this.handleAuthenticationError(e))
  }

  handleAuthenticationSuccess() {
    this.auth.initSubjectInformation().then(() => {
      this.usage.sendGeneralEvent(EnrolmentEventType.SUCCESS)
      this.goToSlideById('privacy-policy')
    })
  }

  handleAuthenticationError(e) {
    this.handleError(e)
    this.loading = false
    this.auth.reset()
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
        handler: () => { }
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
        }) as AlertInput
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

  initializeDeepLinking() {
    App.addListener('appUrlOpen', event => {
      const url = new URL(event.url)
      if (url.hostname === 'enrol') {
        this.authenticate(event.url)
      }
    })
  }
}
