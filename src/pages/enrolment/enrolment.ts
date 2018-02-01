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
    /*this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
I0MjVkN2UzZC1lNjg1LTRmZTgtODAwMS1iMDIxNjVkZmZhNjQiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiNDI1ZDdlM2QtZTY4NS00ZmU4LTgwMDEtYjAyMTY1ZG\
ZmYTY0Iiwicm9sZXMiOlsiVEVTVC1QUk9KRUNUMTpST0xFX1BBUlRJQ0lQQU5UIl\
0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1\
BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdG\
V3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLC\
JzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIl\
NVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIl\
NPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS\
5SRUFEIl0sImF0aSI6ImQzOGRjMjY5LTk1OTQtNDIyYi05ODg1LTcwNWY2MDQxMW\
Q5MCIsImV4cCI6MTUyNTQ1NTU3MiwiaWF0IjoxNTE3NTA2NzcyLCJqdGkiOiI4Mj\
QxYThjNy0yNWQyLTQ1MzMtYTVhOS1jYjllNzYyNmYyZjIifQ.jd6UWubLXdMOYR-\
gypY2I38Ogijr-aR2Jiqa5jCqDGW9F5dUbWQ4EEQD3aJCqSVwOyaW_6YJugCNiID\
z8yZEVYXptuA6G4Kd5NI1wYk-OX18gTLNkjrYUh-5rz_0EtR2Ff02KtszMyaWZqM\
t2BUBbsru0DhYoyw20L834r8dwO-JkHjgUP1nblJF_6cN4Jn-s9hOVHUUFi8XleW\
iINnLgMODT05s_wCmKjPXQE1o7Vpl6l0ui_0Doj0LVwLrA64p6WejeCHhHVc4CKm\
Xz0DK3TCEoRNfkonnx62VpBF7jiAzxDOQO_f-d8iUXCRJgWrnUE3GYQAxFadGPK1\
-lTLUub67jITvByjQ3j2_3vtJifnoHPgHNshF8vgdCe1Es2ueiazWXGZCe3_v1QK\
ONLN609DV_dBpK9OLpPc4ixRZRnInM1dAd2blBBPrqQBOMOLApBhcjJZPgEGfr3v\
2sPCoDyDxxvy3iDmJbgyc6cVZ0YdetkypUt-f8p9NYB_PTRHbS7xRgPtjflpVlnH\
rKxe0lbjLXu8C05GzMcQkSxPgoleXYWCrV9RcbsxfPl-zW-DD5JSwwpFAskzF2x_\
BhNejpc_uuR7Jn2PdK65QYoUl82DzyQgVxE1-SpbyU5xSoJ_0vc7B4LSFCYAE8pT\
7Rr8r3on0daY-FyPVhA3hKJpNfsY"}'})*/
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
          this.displayErrorMessage(error)
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
