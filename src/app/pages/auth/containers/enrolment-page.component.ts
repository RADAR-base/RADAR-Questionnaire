import { Component, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { NavController, Slides } from 'ionic-angular'

import {
  DefaultEnrolmentBaseURL,
  DefaultLanguage,
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport,
  LanguageMap
} from '../../../../assets/data/defaultConfig'
import { AppComponent } from '../../../core/containers/app.component'
import { AlertService } from '../../../core/services/alert.service'
import { LocalizationService } from '../../../core/services/localization.service'
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
  metaQRForm: FormGroup = new FormGroup({
    baseURL: new FormControl(DefaultEnrolmentBaseURL, this.auth.URLValidators),
    tokenName: new FormControl('', [Validators.required])
  })
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  language?: LanguageSetting = DefaultLanguage
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService
  ) {}

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
    this.localization.update().then(lang => (this.language = lang))
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
    this.loading = true
    const scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
    }
    this.scanner
      .scan(scanOptions)
      .then(scannedObj => this.authenticate(scannedObj.text))
  }

  metaQRHandler() {
    if (this.metaQRForm.valid)
      this.authenticate(
        this.auth.getURLFromToken(
          this.metaQRForm.get('baseURL').value.trim(),
          this.metaQRForm.get('tokenName').value.trim()
        )
      )
    else this.handleError(new Error())
  }

  authenticate(authObj) {
    this.showOutcomeStatus = false
    this.loading = true
    this.auth
      .authenticate(authObj)
      .catch(e => this.handleError(e))
      .then(() => this.auth.enrol())
      .then(() => {
        return this.next()
      })
      .catch(e => this.handleError({ status: 0 }))
      .then(() => (this.loading = false))
  }

  handleError(e) {
    e.statusText = 'Error: Cannot get the refresh token from the URL'
    if (e.status == 410) e.statusText = 'URL expired. Regenerate the QR code.'
    if (e.status == 409) e.statusText = 'Re-registered an existing source'
    if (e.status == 0) e.statusText = 'Initializing data error'
    console.log(e.statusText + ' - ' + e.status)
    this.showOutcomeStatus = true
    this.outcomeStatus = e.statusText + ' (' + e.status + ')'
  }

  clearStatus() {
    this.showOutcomeStatus = false
  }

  navigateToHome() {
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
            return this.navCtrl.setRoot(AppComponent)
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
