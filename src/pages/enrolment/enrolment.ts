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
    // TESTING
    /*this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
I5NTA3ZThjZi1kOTdiLTQ1YWEtYjg3MC0yNTAxNDRiMDQ0ZjEiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiOTUwN2U4Y2YtZDk3Yi00NWFhLWI4NzAtMjUwMTQ0Yj\
A0NGYxIiwicm9sZXMiOlsiVEVTVC1QUk9KRUNUMTpST0xFX1BBUlRJQ0lQQU5UIl\
0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1\
BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdG\
V3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLC\
JzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIl\
NVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIl\
NPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS\
5SRUFEIl0sImF0aSI6IjQ0MTAyZjhjLTYzMTItNDViYy1hYzJkLTc4ZWViOTM5Nm\
QwYSIsImV4cCI6MTUzMDAxMzUzMSwiaWF0IjoxNTIyMDY0NzMxLCJqdGkiOiIxOW\
FhN2JhMi01MzY1LTQzNDctOWU3ZC0zNmUzMzJkNTQ3NjYifQ.I6WW-i_m40zebX1\
bhgKoQf5CSKQD6zhd21RS_4O2sm8-Pw7vyWGctwHBcaeMSp2Wx2hpNKM-p7hTCKQ\
ThtRM83LNK2JqaRDsZLYnfMwU4XXssE0oOh__EuMCSn2SeMojBaWSp29Scn163vN\
vXhMX_NcBG0A9fkrCKISGSHSVMRdOrOMRrTZSyGBXKQLadJp9OgzjZuYLmmcRNAh\
pZ79HFVGHAXTOrcI8df0mV0lwiZxGsqjGTT6rwYvxu24gWLzITzWUmurfxTbXOOQ\
OQrOcRx0QOorc1QyL06RlgxJlOZabfd0ZFbFfEJSpi2y9nuihOADCV5Caurddbpo\
RBsvGTcpw09C1ePOxwmqht42UUfHINfV8tvHXwpJf7aYyXT-gZhmr1DOlJeY_TLB\
S_XguE7GGel_FS7BGAlCg-Hxj7Pa6-aFAi5k9PLjpmLuxpqHhlt_6hHqLfMMrV4-\
WJztmPTjba34UVmti1yYH3DGWkt_Bd8qYln0h2NmxVl81gh3ebKPnySvz2atxq7Y\
1NWpsMP7yjlvV13Vsy0LvHCqSB4x5Tk-H7L3q_tQLxVl-Pme57PrA3uCGe9JLpsT\
Et7lotPoMjY44bUVC_foz2NfavfMx_OnVcXJapd1lkGe-1N3-2ZCnAP8Oe5ganKR\
-jlFjFO4vJQx4Lytgv5uGdQtfMwY"}'})*/
//MDD
/*this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
JlYTYxZGIzMy1mYzkxLTRjMGItYWZmZS1lYjM5ZDE1NDE1NmUiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiZWE2MWRiMzMtZmM5MS00YzBiLWFmZmUtZWIzOWQxNT\
QxNTZlIiwicm9sZXMiOlsiUkFEQVItTURELUtDTC1zMTpST0xFX1BBUlRJQ0lQQU\
5UIl0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0\
xFX1BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2\
dhdGV3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudW\
xsLCJzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURS\
IsIlNVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRC\
IsIlNPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk\
9MRS5SRUFEIl0sImF0aSI6IjcwZTUzMzU4LWU1Y2EtNGQ3Yy04NzE2LWFmYWRmYj\
BkOTgwMyIsImV4cCI6MTUyOTc2NzEyMCwiaWF0IjoxNTIxODE4MzIwLCJqdGkiOi\
I2ZDg2Mzc5NS04NmIxLTRlMWQtOTUxOC0zNTNhMjIxYjM3NTAifQ.WPSIkWoceAn\
VWdSOHEanN6NVDUyVgHzX8nJLbgLRUOHRmNSRLV5QXudSzF5cX8x0BZqMxQuMYAn\
xJ7rDwrbGxsepXBE0cCzXJwHcDOk_NVMzUANzu6bEjgrQJIOonDdGvr5WR09rL3n\
srgIpoeNiwGzJmRHL5tU7RzqlgYN6j2pL3RJQcEXNf76UTc8dbYAmnoTfSgYJ6kW\
Y5vgEA2siAm_s-lWolYdm9ew9xkJeP6_Y1Y3DiiukmBE1wrkaScDluDxumkrzRE_\
XzM2pnxO0aEs2U2gUbrKWAZgJxOKnwH8MHjJh-vKYxqdJ3-2rO95_CIJg-bbOTrT\
9GVPp53-Qh0zMDQsx9hqnzoKNS7-JN2y6ZSziEU_OcbNqjIO9P09u42NQrkbW8_w\
6siV-lX7nDH40fJcJlwO1fn2qHiuxtxl1e_c3Cyo9zePTict9zd3CoXzwPKiiWmZ\
qzEA6r2h6j8vE3Ed70U79J2GuwTCnxIN7UUiJFcJtaB5ASieoxqhjJV_blVmJg-b\
yqcqZxIi4kulORTsObGe4qlZ6_euC0Q5nqmzfjyF-KQMVoVO7hw3dLvC74s42MlI\
lqZaRsDBx9gks9CuYR1h2_wupoiOyjA9lOaaxRAPCIYBylHJdKnycHuKskVLrxl2\
BMZQPfIVQWTPwcHgoG_dyzS421waS5bs"}'})*/
//MS Test
this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
IxYzk2MDgwYS1iNzhiLTQ4NzItOTAxYi1mNTQwMDUzYTI3YzUiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiMWM5NjA4MGEtYjc4Yi00ODcyLTkwMWItZjU0MDA1M2\
EyN2M1Iiwicm9sZXMiOlsiTVNfVEVTVDpST0xFX1BBUlRJQ0lQQU5UIl0sImlzcy\
I6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1BBUlRJQ0\
lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdGV3YXkiLC\
JyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLCJzY29wZS\
I6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIlNVQkpFQ1\
QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIlNPVVJDRS\
5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS5SRUFEIl\
0sImF0aSI6ImI2ZmQwZmJkLTBmODItNGM0NS05MTEwLWZlMzQ5ZmNkNmRhMCIsIm\
V4cCI6MTUyNzE5OTQyNCwiaWF0IjoxNTE5MjUwNjI0LCJqdGkiOiIxY2JiMTQyMC\
1hOGM2LTRlMjAtYmJlZi0zOGNmYTdmYWI0OGIifQ.W4WDExRNW3XW_JZMFRACtjs\
m5k1c5TdNsszN71wqd4gokYrMCvLYh2R2mcxNG7X0q964OeLEMu07CMLTqw_jm59\
2vaS198Kp9A4MEBz4MBS7TS9e8sDHJmG-DifjeP9M4u5ipllyVzrAHuilQzWiYZL\
b7eNSjphjINeaqRvLqqq00Bn9mw0wOSIQRB-2cBNdZjBpE8FCkN0Vm_laX4KV0av\
e7YS5USsmzS8wjvS0vG1EQcHj2lDUlwgfm-A_q1R-5iaH5b55ovEqSlyUxdpRYi6\
k1yhBQWB4M3N4Ck-dgUJ6JRuo-PXLaEY5NmJYijgFHxw4ZIHAmseM1fLWTivz6oG\
gitB3nIx9r4f12sOsIcOQvVln13Vxbi49dvJLAlDeB-LdDPAPCsv1ueb8iRBUrhy\
QFNHTKIeSevvMMcs_2xYYqBfVwo_UJ9ovt9FyYtu0Cl8eealJTu5xQRtHr5UT50V\
pmmptMEAOla5SpN_VtEsok0UrvWAbkeAkJJkqAaspQCuLlCxEjRn4S2DCupZtlfe\
qoR04MN0d12gCtuBcaceNgSCULaQt-wJi5lSmjzNw7FKgFJL-Wlg1BvvkzWqMJ7T\
Wqvi1_Qvi93lD8Xxv4BKy2nyYw-ZC0FN1WEQIzkaKIX6HmZmLRJKfJSr0Hom5Xs6\
gxVhyVCq7i9Hfm41V7Oc"}'})

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
