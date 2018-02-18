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
JlNDRlZWMxYy1lMWRmLTRiMjUtYmIxOC04MTM4MmFkZjVmMmUiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiZTQ0ZWVjMWMtZTFkZi00YjI1LWJiMTgtODEzODJhZG\
Y1ZjJlIiwicm9sZXMiOlsiVEVTVC1QUk9KRUNUMTpST0xFX1BBUlRJQ0lQQU5UIl\
0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1\
BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdG\
V3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLC\
JzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIl\
NVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIl\
NPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS\
5SRUFEIl0sImF0aSI6ImE4ZDU4ZDYyLWU4M2EtNGU0Zi05ZGY3LTdhZTc0ZTg5Nm\
IzZSIsImV4cCI6MTUyNjM3NzQwOCwiaWF0IjoxNTE4NDI4NjA4LCJqdGkiOiJlYm\
M3Y2FjMi04NmU4LTQwOGEtYTlhMS03M2JkZTc5ZmRkYWIifQ.CLvI8PzADpgxVQw\
RbznGFrPhW7Uxy_DdWNfYvd6y1dgdmmTYZLEBBr5YKSSRr9KMZ-aoK_R2kN6OBff\
7zerrPI_jx4Sm1KPTxseO-ui2lH9XDwh3sLysI8ugyl0DK9spcjCIqfpQRTxPqIt\
htXV9i_QcU6i_vYAEZIyEH0RY2Aj3ZCGSibEFt6dF1GGyHsIxXYnoBx3_T8_cp26\
gMLmazXxCdFRNAsQiMh8q9eV8QMDf7GaMA3VjrtlPU_GWlqo-tEVHK9AUZQ-3trK\
rOZDNsEn6hWPLluM6Enfw63ldIuD0PcLc1sGrysHmt6c_qAE2agTjLfWKdT2zD0u\
9CY-x8DZFExJsdJzvAC3IMWfmdmjtPanSAZGh5ducM-_FBHsw5J4N_9NoAbBlGDW\
z_BPd6isb8-_gDmMemDTGXF_xQLT6tJP6rhE1k71yAv06whZsvF3OHWTj9812NWx\
hr5fRmLFpoLisycBCRS6InHIIo2pbPIMzMHJdzz5X4zl-NQnitiRmntBU7PyBE2I\
uhD6nt7dCK7g-BKF7cNBnZusaW_j1GDLLYI6jtcZu7DWS8YAyNtxKtG3fKMkhB1F\
CeMq0VhJaDthyOsfJKomTAqghZyqm6WKHgUDPCHeMnuccgv-1rzT7S_iAiXxqy4m\
-7xW4qwX37I6Z-Uc77Rhr5QRlxJI"}'})*/
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
