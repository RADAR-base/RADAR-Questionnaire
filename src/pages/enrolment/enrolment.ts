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
    //this.scanner.scan(scanOptions).then((scannedObj) => this.authenticate(scannedObj))

    //TODO remove when finished
    this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
I2NzhkYTIyNy04NjY0LTQ5ZjAtOGMxMS1kMDM3NzU0NTYzODEiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiNjc4ZGEyMjctODY2NC00OWYwLThjMTEtZDAzNzc1ND\
U2MzgxIiwicm9sZXMiOlsiVEVTVC1QUk9KRUNUMTpST0xFX1BBUlRJQ0lQQU5UIl\
0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1\
BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdG\
V3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLC\
JzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIl\
NVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIl\
NPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS\
5SRUFEIl0sImF0aSI6IjY0MzEwMTRjLTgwOTQtNGY5Yi04ZWEyLWE5YmQ5MWEzNm\
M3NSIsImV4cCI6MTUyMjE2NzY4MSwiaWF0IjoxNTE0MjE4ODgxLCJqdGkiOiIzYT\
I1NjAyYy02ODEzLTQ5MGMtYjAxOS0wZTA3MmNkYWVkZTEifQ.WxEvbn6I9hTyUVV\
ETQiXh-mv_9KDirgOlZBiUSAwqWPjT7sIspozOqOwF3vy43LRZe8x1vapMqFSHkV\
5-Ay4qOfWOGv76bmL1UyE9Wy36K96me11k0XLlWMq6fwr7bjoHXEfgZsEKFlJydM\
vkNDoXNEyD4U9mi2kGgkZ73KfCI2G2PdwRk0fyneaHfiowTmkBgV6hdYnVBvHRol\
vbQVwaOvcQHzbfzjnxjKR_H-mruYBKg3m7RKNxx_MGWEeM8BRXt8G4V824LDf4WZ\
je7gQg4QaOKisfaPsZQPTfuqkAs5bqw-QpR8GVqGikq3rrHOisIyRmp_WZP8sHCk\
1DIZG0_3dozkaVXV0c9-5MidUDZyqZZ7mnOMXcM414M5mTHkOE7RNsJ9om5jWJsU\
z8jvDoZi0Y-e95yAF78kzdoDY_FpYu2tHTZMaux3zomZT4j9tVzbTCnr1Hrxjvon\
ivMCTFAy-VaUQhYq_jcYUbklvcXbhydzw4OcuFLFajkDrkPUOaTELyH-7PPq6OT6\
eyMCxq7y6rXlXmzaL3t_weaxxMQL1X_lj_fKiz1l-wNTOQrqSFFomNqa4ZQyUoc3\
ldeqGyH92AUi39roUGFRUH3_qUChfMgxXG6zgBKxNse2MYy76m6DXSAjAYuh5RQV\
w_gBPuh1puedNyBuE3Ao7irMEazQ"}'})
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
