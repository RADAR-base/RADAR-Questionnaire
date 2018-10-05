import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Component, ElementRef, ViewChild } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { AlertController, NavController, Slides } from 'ionic-angular'

import { MyApp } from '../../app/app.component'
import {
  DefaultEndPoint,
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport,
  DefaultSourceTypeModel,
  LanguageMap,
  URI_managementPortal
} from '../../assets/data/defaultConfig'
import { LocKeys } from '../../enums/localisations'
import { StorageKeys } from '../../enums/storage'
import { LanguageSetting, WeeklyReportSubSettings } from '../../models/settings'
import { TranslatePipe } from '../../pipes/translate/translate'
import { AuthService } from '../../providers/auth-service'
import { ConfigService } from '../../providers/config-service'
import { SchedulingService } from '../../providers/scheduling-service'
import { StorageService } from '../../providers/storage-service'
import { HomePage } from '../home/home'

@Component({
  selector: 'page-enrolment',
  templateUrl: 'enrolment.html'
})
export class EnrolmentPage {
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

  language: LanguageSetting = {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  }

  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages
  enterMetaQR = false
  tokenName: string
  baseURL = DefaultEndPoint + URI_managementPortal

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    public storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private authService: AuthService,
    private translate: TranslatePipe,
    private jwtHelper: JwtHelperService,
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

  scanQR() {
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

  submitToken() {
    this.authenticate(
      this.authService.getURLFromToken(
        this.baseURL.trim(),
        this.tokenName.trim()
      )
    )
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
          const auth = JSON.parse(authObj.text)
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
    // tslint:disable-next-line:max-line-length
    const regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/
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
      // console.debug('Subject Info retrieved : ' + subjectInformation.text)
      // console.debug('Project Name: ' + projectName)
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

  enterTokenOption() {
    this.enterMetaQR = true
    this.next()
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePage)
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
          this.navCtrl.setRoot(MyApp)
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
