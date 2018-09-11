import { Component, ViewChild, ElementRef } from '@angular/core'
import { ConfigService } from '../../providers/config-service';
import { StorageService } from '../../providers/storage-service';
import { SchedulingService } from '../../providers/scheduling-service'
import { AuthService } from '../../providers/auth-service';
import { StorageKeys } from '../../enums/storage'
import { NavController, Slides, AlertController } from 'ionic-angular'
import { WeeklyReportSubSettings } from '../../models/settings'
import { DefaultSettingsWeeklyReport,
  DefaultSourceTypeModel,
  DefaultSettingsSupportedLanguages,
  LanguageMap} from '../../assets/data/defaultConfig'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { HomePage } from '../home/home'
import { LocKeys } from '../../enums/localisations'
import { JwtHelper } from 'angular2-jwt'
import { LanguageSetting } from '../../models/settings'
import { TranslatePipe } from '../../pipes/translate/translate';
import { MyApp } from '../../app/app.component';
import { HttpClient, HttpHeaders } from '@angular/common/http'

@Component({
  selector: 'page-enrolment',
  templateUrl: 'enrolment.html'
})
export class EnrolmentPage {

  @ViewChild(Slides)
  slides: Slides;
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
    value: "en"
  }

  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    public storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private authService: AuthService,
    private translate: TranslatePipe,
    private jwtHelper: JwtHelper,
    private alertCtrl: AlertController
  ) {
  }

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
    this.storage.get(StorageKeys.LANGUAGE)
    .then((lang) => {
      if(lang != null){
        this.language = lang
      }
    })
  }

  ionViewDidEnter() {
  }

  scan() {
    this.loading = true
    let scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
      //disableAnimations: true
    }
    this.scanner.scan(scanOptions).then((scannedObj) => this.authenticate(scannedObj))

}

  authenticate(authObj) {
    this.showOutcomeStatus = false
    this.transitionStatuses()

    var authText = authObj.text
    new Promise((resolve, reject) => {
      var refreshToken = null;
      if(this.validURL(authText)) {
        // Meta Qr code
        // TODO :: Add a field to enter the short url+13char code manually
        this.authService.getRefreshTokenFromUrl(authText).then((body : any) => {
          refreshToken = body['refreshToken']
          if(body['baseUrl']) {
            this.storage.set(StorageKeys.BASE_URI, body['baseUrl'])
            this.authService.updateURI()
          }
          resolve(refreshToken)
        }).catch((e) => {
          if(e.status === 410) {
            e.statusText = 'URL expired. Regenerate the QR code.'
          } else {
            e.statusText = 'Error: Cannot get the refresh token from the URL'
          }
          console.log(e.statusText + ' - ' + e.status)
          this.displayErrorMessage(e)
        })
      } else {
        // Normal QR codes: containing refresh token as JSON
        this.authService.updateURI().then(() => {
        console.log('BASE URI : ' + this.storage.get(StorageKeys.BASE_URI))
        let auth = JSON.parse(authText)
        refreshToken = auth.refreshToken
        resolve(refreshToken)
      })
      }
    })
    .catch((e) => {
      console.error('Cannot Parse Refresh Token from the QR code. '
        + 'Please make sure the QR code contains either a JSON or a URL pointing to this JSON ' + e)
        e.statusText = 'Cannot Parse Refresh Token from the QR code.'
      this.displayErrorMessage(e);
    })
    .then((refreshToken) => {
      if(refreshToken === null) {
        let error = new Error('refresh token cannot be null.')
        this.displayErrorMessage(error);
        throw error
      }
      this.authService.registerToken(refreshToken)
      .then(() => {
        this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
          this.authService.registerAsSource()
          .then(() => {
            this.retrieveSubjectInformation()
          })
          .catch((error) => {
            let modifiedError = error
            this.retrieveSubjectInformation()
            modifiedError.statusText = "Re-registered an existing source "
            this.displayErrorMessage(modifiedError)
          })
        })
      })
      .catch((error) => {
        this.displayErrorMessage(error)
      })
    }).catch((error) => {
      this.displayErrorMessage(error)
    })
  }

  validURL(str){
    var regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
          if (regexp.test(str))
          {
            return true;
          }
          else
          {
            return false;
          }
  }

  retrieveSubjectInformation() {
    this.authService.getSubjectInformation().then((res) => {
      let subjectInformation:any = res
      let participantId = subjectInformation.externalId
      let participantLogin = subjectInformation.login
      let projectName = subjectInformation.project.projectName
      let sourceId = this.getSourceId(subjectInformation)
      let createdDate = new Date(subjectInformation.createdDate)
      let createdDateMidnight = this.schedule.setDateTimeToMidnight(new Date(subjectInformation.createdDate))
      console.debug('Subject Info retrieved : ' + subjectInformation.text)
      console.debug('Project Name: ' + projectName)
      this.storage.init(
        participantId,
        participantLogin,
        projectName,
        sourceId,
        this.language,
        createdDate,
        createdDateMidnight)
      .then(() => {
        this.doAfterAuthentication()
      })
    })
  }

  doAfterAuthentication() {
    this.configService.fetchConfigState(true)
    this.next()
  }

  displayErrorMessage (error) {
    this.loading = false
    this.showOutcomeStatus = true
    let msg = error.statusText + ' (' + error.status + ')'
    this.outcomeStatus = msg
    this.transitionStatuses()
  }

  weeklyReportChange(index) {
    this.reportSettings[index].show != this.reportSettings[index].show
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.reportSettings)
  }

  transitionStatuses() {
    if (this.loading) {
      this.elOutcome.nativeElement.style.opacity = 0
      this.elLoading.nativeElement.style.opacity = 1
    }
    if (this.showOutcomeStatus) {
      this.elOutcome.nativeElement.style.transform =
        'translate3d(-100%,0,0)'
      this.elOutcome.nativeElement.style.opacity = 1
      this.elLoading.nativeElement.style.opacity = 0
    }
  }

  getSourceId(response) {
    let sources = response.sources
    for(var i = 0; i < sources.length; i++) {
      if(sources[i].sourceTypeModel == DefaultSourceTypeModel) {
        return sources[i].sourceId
      }
    }
    return 'Device not available'
  }

  next() {
    this.slides.lockSwipes(false)
    let slideIndex = this.slides.getActiveIndex() + 1
    this.slides.slideTo(slideIndex, 500)
    this.slides.lockSwipes(true)
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePage)
  }

  showSelectLanguage() {
    let buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {
        }
      },
      {
        text: this.translate.transform(LocKeys.BTN_SET.toString()),
        handler: (selectedLanguageVal) => {
          let lang: LanguageSetting = {
            "label": LanguageMap[selectedLanguageVal],
            "value": selectedLanguageVal
          }
          this.storage.set(StorageKeys.LANGUAGE, lang)
          this.language = lang
          this.navCtrl.setRoot(MyApp)
        }
      }
    ]
    var inputs = []
    for(var i=0; i<this.languagesSelectable.length; i++){
      var checked = false
      if(this.languagesSelectable[i]["label"] == this.language.label) {
        checked = true
      }
      inputs.push({
        type: 'radio',
        label: this.translate.transform(this.languagesSelectable[i]["label"].toString()),
        value: this.languagesSelectable[i]["value"],
        checked: checked
      })
    }
    this.showAlert({
      'title': this.translate.transform(LocKeys.SETTINGS_LANGUAGE_ALERT.toString()),
      'buttons': buttons,
      'inputs': inputs
    })
  }

  showAlert(parameters) {
    let alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if(parameters.message) {
      alert.setMessage(parameters.message)
    }
    if(parameters.inputs) {
      for(var i=0; i<parameters.inputs.length; i++){
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }

}
