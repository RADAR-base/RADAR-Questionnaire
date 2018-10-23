import { Component, ElementRef, ViewChild } from '@angular/core'
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { AlertController, NavController, Slides } from 'ionic-angular'

import {
  DefaultEnrolmentBaseURL,
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport,
  DefaultSourceTypeModel,
  LanguageMap,
  URI_managementPortal
} from '../../../../assets/data/defaultConfig'
import { AppComponent } from '../../../core/containers/app.component'
import { ConfigService } from '../../../core/services/config.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  LanguageSetting,
  WeeklyReportSubSettings
} from '../../../shared/models/settings'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { AuthService } from '../services/auth.service'

@Component({
  selector: 'page-enrolment',
  templateUrl: 'enrolment-page.component.html'
})
export class EnrolmentPageComponent {
  @ViewChild(Slides)
  slides: Slides
  @ViewChild('loading')
  elLoading: ElementRef
  @ViewChild('outcome')
  elOutcome: ElementRef
  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: String
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport

  URLRegEx = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'

  language: LanguageSetting = {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  }
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages

  enterMetaQR = false
  metaQRForm: FormGroup = new FormGroup({
    baseURL: new FormControl(DefaultEnrolmentBaseURL, [
      Validators.required,
      Validators.pattern(this.URLRegEx)
    ]),
    tokenName: new FormControl('', [Validators.required])
  })

  get tokenName() {
    return this.metaQRForm.get('tokenName')
  }
  get baseURL() {
    return this.metaQRForm.get('baseURL')
  }

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    public storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private authService: AuthService,
    private translate: TranslatePipe,
    private alertCtrl: AlertController
  ) {}

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
    this.storage.get(StorageKeys.LANGUAGE).then(lang => {
      if (lang != null) {
        this.language = lang
      }
    })
  }

  ionViewDidEnter() {}

  scanQRHandler() {
    this.loading = true
    const scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
      // disableAnimations: true
    }
    this.scanner
      .scan(scanOptions)
      .then(scannedObj => this.authenticate(scannedObj.text))
  }

  metaQRHandler() {
    if (this.baseURL.errors) {
      this.displayErrorMessage({ statusText: 'Invalid Base URL' })
      return
    }
    if (this.tokenName.errors) {
      this.displayErrorMessage({ statusText: 'Invalid Token Name' })
      return
    }
    if (!this.baseURL.errors && !this.tokenName.errors) {
      this.authenticate(
        this.authService.getURLFromToken(
          this.baseURL.value.trim(),
          this.tokenName.value.trim()
        )
      )
    }
  }

  authenticate(authObj) {
    this.showOutcomeStatus = false
    this.transitionStatuses()

    new Promise((resolve, reject) => {
      let refreshToken = null
      if (this.validURL(authObj)) {
        // NOTE: Meta QR code and new QR code
        this.authService
          .getRefreshTokenFromUrl(authObj)
          .then((body: any) => {
            refreshToken = body['refreshToken']
            if (body['baseUrl']) {
              this.storage.set(StorageKeys.BASE_URI, body['baseUrl'])
              this.authService.updateURI()
            }
            resolve(refreshToken)
          })
          .catch(e => {
            if (e.status === 410) {
              e.statusText = 'URL expired. Regenerate the QR code.'
            } else {
              e.statusText = 'Error: Cannot get the refresh token from the URL'
            }
            console.log(e.statusText + ' - ' + e.status)
            this.displayErrorMessage(e)
          })
      } else {
        // NOTE: Old QR codes: containing refresh token as JSON
        this.authService.updateURI().then(() => {
          console.log('BASE URI : ' + this.storage.get(StorageKeys.BASE_URI))
          const auth = JSON.parse(authObj)
          refreshToken = auth.refreshToken
          resolve(refreshToken)
        })
      }
    })
      .catch(e => {
        console.error(
          'Cannot Parse Refresh Token from the QR code. ' +
            'Please make sure the QR code contains either a JSON or a URL pointing to this JSON ' +
            e
        )
        e.statusText = 'Cannot Parse Refresh Token from the QR code.'
        this.displayErrorMessage(e)
      })
      .then(refreshToken => {
        if (refreshToken === null) {
          const error = new Error('refresh token cannot be null.')
          this.displayErrorMessage(error)
          throw error
        }
        this.authService
          .registerToken(refreshToken)
          .then(() => {
            this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
              this.authService
                .registerAsSource()
                .then(() => {
                  this.retrieveSubjectInformation()
                })
                .catch(error => {
                  const modifiedError = error
                  this.retrieveSubjectInformation()
                  modifiedError.statusText = 'Re-registered an existing source '
                  this.displayErrorMessage(modifiedError)
                })
            })
          })
          .catch(error => {
            this.displayErrorMessage(error)
          })
      })
      .catch(error => {
        this.displayErrorMessage(error)
      })
  }

  validURL(str) {
    const regexp = new RegExp(this.URLRegEx)
    if (regexp.test(str)) {
      return true
    } else {
      return false
    }
  }

  retrieveSubjectInformation() {
    this.authService.getSubjectInformation().then(res => {
      const subjectInformation: any = res
      const participantId = subjectInformation.externalId
      const participantLogin = subjectInformation.login
      const projectName = subjectInformation.project.projectName
      const sourceId = this.getSourceId(subjectInformation)
      const createdDate = new Date(subjectInformation.createdDate)
      const createdDateMidnight = this.schedule.setDateTimeToMidnight(
        new Date(subjectInformation.createdDate)
      )
      this.storage
        .init(
          participantId,
          participantLogin,
          projectName,
          sourceId,
          this.language,
          createdDate,
          createdDateMidnight
        )
        .then(() => {
          this.doAfterAuthentication()
        })
    })
  }

  doAfterAuthentication() {
    this.configService.fetchConfigState(true)
    this.next()
  }

  displayErrorMessage(error) {
    this.loading = false
    this.showOutcomeStatus = true
    const msg = error.statusText + ' (' + error.status + ')'
    this.outcomeStatus = msg
    this.transitionStatuses()
  }

  weeklyReportChange(index) {
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.reportSettings)
  }

  transitionStatuses() {
    if (this.loading) {
      this.elOutcome.nativeElement.style.opacity = 0
      this.elLoading.nativeElement.style.opacity = 1
    }
    if (this.showOutcomeStatus) {
      this.elOutcome.nativeElement.style.transform = 'translate3d(-100%,0,0)'
      this.elOutcome.nativeElement.style.opacity = 1
      this.elLoading.nativeElement.style.opacity = 0
    }
  }

  getSourceId(response) {
    const sources = response.sources
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].sourceTypeModel === DefaultSourceTypeModel) {
        return sources[i].sourceId
      }
    }
    return 'Device not available'
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

  navigateToHome() {
    this.navCtrl.setRoot(HomePageComponent)
  }

  showSelectLanguage() {
    const buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {}
      },
      {
        text: this.translate.transform(LocKeys.BTN_SET.toString()),
        handler: selectedLanguageVal => {
          const lang: LanguageSetting = {
            label: LanguageMap[selectedLanguageVal],
            value: selectedLanguageVal
          }
          this.storage.set(StorageKeys.LANGUAGE, lang)
          this.language = lang
          this.navCtrl.setRoot(AppComponent)
        }
      }
    ]
    const inputs = []
    for (let i = 0; i < this.languagesSelectable.length; i++) {
      let checked = false
      if (this.languagesSelectable[i]['label'] === this.language.label) {
        checked = true
      }
      inputs.push({
        type: 'radio',
        label: this.translate.transform(
          this.languagesSelectable[i]['label'].toString()
        ),
        value: this.languagesSelectable[i]['value'],
        checked: checked
      })
    }
    this.showAlert({
      title: this.translate.transform(
        LocKeys.SETTINGS_LANGUAGE_ALERT.toString()
      ),
      buttons: buttons,
      inputs: inputs
    })
  }

  showAlert(parameters) {
    const alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if (parameters.message) {
      alert.setMessage(parameters.message)
    }
    if (parameters.inputs) {
      for (let i = 0; i < parameters.inputs.length; i++) {
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }
}
