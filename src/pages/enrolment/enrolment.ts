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
    private storage: StorageService,
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

    //TODO remove when finished
    // TESTING
    this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
IzZTVhM2Q3ZC04MmQ0LTQyYWUtOGYxZS0yNzdhMzU4YTIxOWIiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiM2U1YTNkN2QtODJkNC00MmFlLThmMWUtMjc3YTM1OG\
EyMTliIiwicm9sZXMiOlsiVEVTVC1QUk9KRUNUMTpST0xFX1BBUlRJQ0lQQU5UIl\
0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1\
BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdG\
V3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLC\
JzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIl\
NVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIl\
NPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS\
5SRUFEIl0sImF0aSI6ImI0NTZiMGM4LTVhNDQtNDk0ZS04ZjhmLTA3YjI0ODljOW\
JhYSIsImV4cCI6MTUyNzA5ODY2NywiaWF0IjoxNTE5MTQ5ODY3LCJqdGkiOiI0MD\
Q3NTM2Ny1jNzU5LTQ4NTktODZhZC0xNzVhNGU1YjY3YTgifQ.RiaxqgJ9rDX71i3\
RcgrZNqnQaWuv4BrdivWtHYZeFpJaJOb9vxDVZX8PNNmsYaG951jLg5lXTdSMa06\
CfdKZdrjYRY3mx4Dz3FknMmF6eJGOX6Nzb7Bzg1NWmG7uM907Kbay43JmjGaa0Ff\
krUcSKZXQ8Eft0YFXh8G780B517GwU9_Xl8ygyxMoCM9Q_phVH9cQR7dCyh9gBwl\
Fi7FhccwUOeTKmTG5Rx0paylhnq-GZCOzkdzxBbJBExPwHMHPucqQeO-YZyY0t2K\
Y1G1_7YjL6QZ8JD6eynMt3wlOgZXjfrbXB74OK2PJOk6hck6TBiUsMklqvvsbQGQ\
jaIyf9g4GqyZpceQ7V4MCyJZnhGdFNCVGHAWlGxzcFuFBMxEiLFiuRplQEUAyT4D\
nrtEPAM0GHcXAAyqSacSLJvlI3-yf7HJ1Kzm43bZ5mBdOugVFNVdVeK0XAcyiMCl\
zx0jrdZfGVHVFx1FDr-n6olUvlprVDZpe3BDBslIIloYGzxvWylu4aC9-hamIuFE\
NeByeLf-ERneW6BH6OZgR90lMDrRRD1H8GUYS37ohuKHjRI1Gn64nJBivvVfu6tW\
18SZhKIGGDnnxA6LceoLcOckhSfWCHJF08ZgDzsJORAbzhFxgiGZGXkp-9jIbsvF\
z1y_tpOZDT7qq1756mwhhfNLVDmA"}'})
//MDD
/*this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
JlZDJjNDM5Yy1jNWUyLTRjODItOTYyZi1lYzk1ZWVlN2QwY2QiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiZWQyYzQzOWMtYzVlMi00YzgyLTk2MmYtZWM5NWVlZT\
dkMGNkIiwicm9sZXMiOlsiUkFEQVItTURELUtDTC1zMTpST0xFX1BBUlRJQ0lQQU\
5UIl0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0\
xFX1BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2\
dhdGV3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudW\
xsLCJzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURS\
IsIlNVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRC\
IsIlNPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk\
9MRS5SRUFEIl0sImF0aSI6IjBmZWZjOTVjLWI4OGEtNDViMC1hZTZjLWVhODJkN2\
JmODlmYiIsImV4cCI6MTUyNzA5ODIwOSwiaWF0IjoxNTE5MTQ5NDA5LCJqdGkiOi\
IwZWU2NzlkYS1iOWFhLTQxOWEtODk4MC05MDc0ZGFkNjY0MmUifQ.JOk0vT4MijD\
EMjgUU2xKzmGA4T4ouqxK9CmAY07k8G_dV-6vvxTPpktiLQVAt7i3WMKZGcTutM2\
zMF07-64AxiU9BIAP8FLVrqQ_FyUYNYXGA3m0GXtmlhKDkJxOTxk6uON8HMsYkxd\
EnmyVqXqlW5iVa0MJPRTiPfygFZ6Wt-vTn0n5c_HWksMWZcUnPbfCjVdzq7k-Ufa\
Yl5ZDh9cN22nYCvOqN--e_QWLo9aruRBa5gO_-0Cr4tgKcGS29dbmzwZ6ZUnYGFZ\
ekf94LlAs5FE_9-S41R4wWUyaxH-EMN48yqocUz89WzdwBBORwTyu159qES-Be-N\
ZrE1J7YKudeHIpKDMTdJIi5L0N0zC9eu8Mp_XvA-Xe6zrk8740gwfUeWrjyW9bdB\
sCVZhOxASEsjqTxovnKP0QUrCcDI04XefzkxFjhBN2BXZuhDl9SQ0H7P905_PH8r\
kV8rFzuw-Qon-AWFqC0DXbB2t66040zzoH7s9HYnewzGAMJZjX-L1SdFwUvyWmds\
6z1j8vR_dGAAoJZdhJWMW6aItn4VCWXXA_iTzDxui9yIqvuCtZj48-zuxWPglxbt\
zZdKF6L1Ge9TjzxAjOWJlHugp_e6Ra4A0qoKHwZ-XjM7-OpA_3nFaAkrQ8zzyMC4\
zuj2k-0BgKMWqxSh0P76ZhgmNuJChrPw"}'})*/
}

  authenticate(authObj) {
    this.transitionStatuses()
    let auth = JSON.parse(authObj.text)
    this.authService.registerToken(auth.refreshToken)
    .then(() => {
      this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
        this.authService.registerAsSource()
        .then(() => {
          this.retrieveSubjectInformation()
        })
        .catch((error) => {
          let modifiedError = error
          this.retrieveSubjectInformation()
          modifiedError.statusText = "Reregistered an existing source "
          this.displayErrorMessage(modifiedError)
        })
      })
    })
    .catch((error) => {
      this.displayErrorMessage(error)
    })
  }

  retrieveSubjectInformation() {
    this.authService.getSubjectInformation().then((res) => {
      let subjectInformation:any = res
      let participantId = subjectInformation.id
      let participantLogin = subjectInformation.login
      let projectName = subjectInformation.project.projectName
      let sourceId = this.getSourceId(subjectInformation)
      let createdDate = subjectInformation.createdDate
      let createdDateMidnight = this.schedule.setDateTimeToMidnight(new Date(createdDate))
      this.storage.init(participantId,
        participantLogin,
        projectName,
        sourceId,
        createdDateMidnight,
        this.language)
      .then(() => {
        this.doAfterAuthentication()
      })
    })
  }

  doAfterAuthentication() {
    this.configService.fetchConfigState()
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
