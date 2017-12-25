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
JkYzAzMTM3Zi1kYTlhLTQzMzQtODdmNy1kYTE3MGEwMmJmMzUiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiZGMwMzEzN2YtZGE5YS00MzM0LTg3ZjctZGExNzBhMD\
JiZjM1Iiwicm9sZXMiOlsiUkFEQVItTURELUtDTC1zMTpST0xFX1BBUlRJQ0lQQU\
5UIl0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0\
xFX1BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2\
dhdGV3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudW\
xsLCJzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURS\
IsIlNVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRC\
IsIlNPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk\
9MRS5SRUFEIl0sImF0aSI6IjU1YzdjMzI1LTg2ZTMtNDVhMS04YTUwLTBlYmI2Mj\
lkOWRjZCIsImV4cCI6MTUyMDAwMzMzOSwiaWF0IjoxNTEyMDU0NTM5LCJqdGkiOi\
JkN2E2ODQ2YS00ZWI4LTQyNmQtODE1OC05ZTFjMjkzYzE0MmUifQ.KwuuFjlqBt-\
50V7qLUqbAKGh6Bj_u3lmpJaevZF4DifS6kk6RHLCXVs_93PdnNrCr40r5oe8Cfj\
-5QtVdjm9lqWAFQoC3yXYv0kVwN-sb3F0Zl10nY3zg2xkOJb4wpcO8TQKQ2kyesd\
QXy0svKJ0e_SA7RIaoYgdnKZVCJyMbjJSNpjFbhFsmi-9NY83yJMbwYpi2mD6opj\
g-abaLbnEgVvoWxLNIvXLOwOcKNYV_9iIQEMAiKJRaKXJz5GOdYcZW59E0pSiFzr\
TL1haHZJmWW9Yqa365ruk3g7km8pgnvOCjQh8VA_sfgFaMi0gkdyhF_zWji5kSIh\
WSlgd1SufcxpmrtBSt-Go7ZDPpDNlitiSAK7iOAV59MWbmYLki9z-iYKJTEDtuLf\
Xz56sSpB_3Lxj2Yiagck57hxAqw9jda-C7CX97lszFnb4Eg9T8PSPLyE7Uo0n-9x\
SiyDTZpvnl6ch4-VPbqd-bINmJcIRBzYczFFxL62vTN-T3dgRZxU1-hkwb08OYx5\
5k3yoh0jpSMXwu7pLwWTjsFFy-t019FBHDSqhVgZ8iIvsNvaKNdvass-mhceg4WY\
PU9L1o1Hab8AbbtB9s0bXx_vH4LEL5lQ5Ib90-o5v7aiJo2Q_NjDcZ785mkGRMoE\
pYz35YAEIvZHZH2iBzc3mBV6SGFXqqpc"}'})*/
  }

  authenticate(authObj) {
    this.transitionStatuses()
    let auth = JSON.parse(authObj.text)
    this.authService.registerToken(auth.refreshToken).then(() => {
      this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
        this.authService.registerAsSource().then(() => {
          this.retrieveSubjectInformation()
        })
      })
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
    this.loading = false
    this.showOutcomeStatus = true
    this.configService.fetchConfigState()
    this.setOutcomeStatus(this.showOutcomeStatus)
    this.transitionStatuses()
  }

  weeklyReportChange(index) {
    this.reportSettings[index].show != this.reportSettings[index].show
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.reportSettings)
  }

  setOutcomeStatus(status) {
    if (status) {
      this.outcomeStatus = LocKeys.STATUS_SUCCESS.value
      this.next()
    } else {
      this.outcomeStatus = LocKeys.STATUS_FAILURE.value
    }
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
