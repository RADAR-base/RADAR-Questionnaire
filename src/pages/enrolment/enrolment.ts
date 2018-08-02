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
I5ZGI2NTBkZC1kNmQ3LTRmMjUtOWUyYS1iM2QyMTVlMDAyNjEiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiOWRiNjUwZGQtZDZkNy00ZjI1LTllMmEtYjNkMjE1ZT\
AwMjYxIiwicm9sZXMiOlsiUkFEQVItTURELUtDTC1zMTpST0xFX1BBUlRJQ0lQQU\
5UIl0sImlzcyI6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0\
xFX1BBUlRJQ0lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2\
dhdGV3YXkiLCJyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudW\
xsLCJzY29wZSI6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURS\
IsIlNVQkpFQ1QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRC\
IsIlNPVVJDRS5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk\
9MRS5SRUFEIl0sImF0aSI6IjhhN2ZhNzBhLTlkYzUtNDEzZC04ZGM0LWQzMGUxZj\
VlNDFlNSIsImV4cCI6MTUzOTk0MDgxMywiaWF0IjoxNTMxOTkyMDEzLCJqdGkiOi\
IyYWQ2YTEyYy1iZTg4LTRiODYtYTBmMC1hNjNiNTE4NGNlNmIifQ.NvA8nk93NU6\
lZUDtLBUKQ_uo8P6Qguv06nSyxqQnqjyzJCoN23vCUFpSZZg4tCLZ6ACi8UJsJIp\
1522lNFX8JLMgVxmA2acavwXchQdwPazK-E-IyFW7x0-VZ7vO-GvT6gAfFceu2uK\
0pXr2cMTHrt75EbR5FbCwLmXzQPQMa-iS6rK8EbnECB1xU0hq1xqiPqcZJwKxuQ2\
Na-EXVJtDweh7chmivpc3-ALeCVfK1SQH5NN_Mph4q0TKlwE_hyQuWiDSAwxDyuC\
NnjDQz-cy-DtLWfpMqvlkEodwA4lHSt6Q7NWiuvEPVGCStt8XAGSSGUXhPPSrt2-\
G5-IXSUFMK3BKYG2WjWuSHCxpINxrcH1Nin_33ge47RbwCywDmd1sjaExNbLGFsm\
0DkcVU-IUhVN4iJdWP8knJ1slji9IQMYVZFkFdY23m58uvBsydKrrHgGF3Abk3Pw\
3jJx1L9ueO-pHmQx8nnBIKUYR7rr2aumuaH41LImisHcjeVnPu7S5qyM9GAB4Mg2\
rVeR-gFwYvm0sw62U0gXfB90aDnndbsd7cHvAoPsj0nxux9cwCqn-4nO_hEoSD4X\
4DbmmPdUbGpEJXYK1vRLQ-yddAaxzO0eoiq_WNKAmK5_9BrUYAjPAE1GWJGLPeGa\
uZ5gVfAxrIpeID3lQNjt_m4d7apXKyIg"}'})*/
//MS Test
/*this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
JlYzJhYWZmMi1hZDcyLTRlMzQtYTBkNC1lNDdhN2IwYWYwM2QiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiZWMyYWFmZjItYWQ3Mi00ZTM0LWEwZDQtZTQ3YTdiMG\
FmMDNkIiwicm9sZXMiOlsiTVNfVEVTVDpST0xFX1BBUlRJQ0lQQU5UIl0sImlzcy\
I6Ik1hbmFnZW1lbnRQb3J0YWwiLCJhdXRob3JpdGllcyI6WyJST0xFX1BBUlRJQ0\
lQQU5UIl0sImNsaWVudF9pZCI6ImFSTVQiLCJhdWQiOlsicmVzX2dhdGV3YXkiLC\
JyZXNfTWFuYWdlbWVudFBvcnRhbCJdLCJncmFudF90eXBlIjpudWxsLCJzY29wZS\
I6WyJNRUFTVVJFTUVOVC5DUkVBVEUiLCJTVUJKRUNULlVQREFURSIsIlNVQkpFQ1\
QuUkVBRCIsIlBST0pFQ1QuUkVBRCIsIlNPVVJDRVRZUEUuUkVBRCIsIlNPVVJDRS\
5SRUFEIiwiU09VUkNFREFUQS5SRUFEIiwiVVNFUi5SRUFEIiwiUk9MRS5SRUFEIl\
0sImF0aSI6ImVjMzc2MDE4LTk3NTUtNDc1OC1hOGY4LTZmNWI1YjI5YzYyZCIsIm\
V4cCI6MTUzNDYwNjQwNywiaWF0IjoxNTI2NjU3NjA3LCJqdGkiOiJmYmI1MGI2ZS\
0yODljLTQ4MWMtYTY0OS1mYjU2NWZkZmMzZWQifQ.WG8GIuh0Szam0lG1V6vRbzA\
rexqfiEbaMWxL9dxhRsuHaA7BqybIT7P7sTIKYMLdHi2HK7v-fCznPztgTh_mfdk\
lIPkCnF1sNewuO4vjwjEBUR6UuFsGqrk9WzPjbbKw2DdHYHRtvuwFTAySDZyz5hP\
QmIDEHvHPJsBjzj61tpRMfWVys0awW4xs7w24mJVjCrGfu6EuzhE6XiQKUxiNURU\
LcQIUAqxlP-9IIDrUFCvSaMpYQfahpJhJH7ljgVYC_Ohq_OBddTmtXLVg-rn_LjL\
Q7lhxjbh99hmks4a2qGgeGMunWGEC-qNghCorNupV-FGqS3sZyFI4iTCwmTfmyXp\
O-f-6SykV-7o5xi3YWpaRO6KC1s_CUrRIn1Nyv6r1rqFOuWquH6imWjnlkKzciEV\
Ggab7g04WlELr5tAfwDCFPYq0bpn7cgQD2GliS9xT70mPlsUBPhLEzEMeyz3Tr5Q\
OvcLlsanKInQnxtZWocrq2PCJ4WJPqAZiJLQE8VcW8yEbhjh4jeMdfau2F0sgivk\
J60U1xNZxDfvRjXuOQuCBk8CgK85EtqCJUYpgK-KSW-p5kz_gx5I4TTR3z8XKFm8\
OkB5CscQQX-O7UcRhToESvBZs2xz01HBjXbw7fKH6SBCEQULt02BqFdlL6SO5_ja\
08Xi8EYcC6b-Br-XsMys"}'})*/
// STAGING_PROJECT
/*this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
JiOTU1OWQ4Ni05ZjU5LTQzZTktOGU2Ni1iZDA5NTFhNTE2ZmEiLCJzb3VyY2VzIj\
pbIjhkMzczYTY1LWJiZjUtNDI5Mi1hZDAyLTcyOTYxZGY0MjY1ZSJdLCJ1c2VyX2\
5hbWUiOiJiOTU1OWQ4Ni05ZjU5LTQzZTktOGU2Ni1iZDA5NTFhNTE2ZmEiLCJyb2\
xlcyI6WyJTVEFHSU5HX1BST0pFQ1Q6Uk9MRV9QQVJUSUNJUEFOVCJdLCJpc3MiOi\
JNYW5hZ2VtZW50UG9ydGFsIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9QQVJUSUNJUE\
FOVCJdLCJjbGllbnRfaWQiOiJhUk1UIiwiYXVkIjpbInJlc19nYXRld2F5Iiwicm\
VzX01hbmFnZW1lbnRQb3J0YWwiXSwiZ3JhbnRfdHlwZSI6bnVsbCwic2NvcGUiOl\
siTUVBU1VSRU1FTlQuQ1JFQVRFIiwiU1VCSkVDVC5VUERBVEUiLCJTVUJKRUNULl\
JFQUQiLCJQUk9KRUNULlJFQUQiLCJTT1VSQ0VUWVBFLlJFQUQiLCJTT1VSQ0UuUk\
VBRCIsIlNPVVJDRURBVEEuUkVBRCIsIlVTRVIuUkVBRCIsIlJPTEUuUkVBRCJdLC\
JhdGkiOiI3ZTE3NTlmZi00NWQ5LTQ2MGItYmYyNC0wMzBhZjlhYTA0OTEiLCJleH\
AiOjE1MzQ2MDY3MzMsImlhdCI6MTUyNjY1NzkzMywianRpIjoiMjRlOWFmNTUtND\
liZS00ZjY5LWE5M2EtMzVmZjg3NzI2YmNkIn0.hz0nWoeRIR858w6N8nF9QwI13x\
-x6OfQHDOhvqWCMfZ9_aJfTijrPNyTPpCl9_YREwhe-gtJTEujzRziDE9xvF2S5i\
Djj-30VgukMhPkjLk6v_Limim2ShcgfEI17Kf0gyim-j1xQq6cGy5mRZ_t9CfKfE\
1fjj34xA53w3XQkm_4mm0UO6mmoyjZOqZ6it91zSjkrakIIvfkVqJzKbhFU5IPlQ\
YGqu93m3XoxYwKkxos0mv8AEZ49bHdCfQUOEx-o95WX3iOrz1x6xUUR_A0ZiKYei\
OpD9ycHycZsI2aNp2XrD5eVlMGV4GcuvkD3O7QsAChlFvGTQszVKDhY_uMS67BTA\
fQ7GX86LFGP2PXRn82p5zUmBc11O5HVzMQHlbRqzhFPz3FoMZ-TYvmgOmiOLUUsi\
KOOeB6wdn013yEB0mDas895TiryZcdP4NydzE7r3pMRdeDVAMDVRptiQKvLJY2me\
7vwj7DlpF7WuNboojNF_ZB0i6QrW1S84tiAmE9R-CKPhNXEl4yHbhFhqlGM5ZaPK\
kr1NFllIu5S58UzZTal6sS7huoYjMSkJDit4bMZFxO66qQAKUuTwXNhgya6F8RBn\
s1a3p2_Jzn2oYybcIbgp_t8DPrPBmzzwFVMUQ2SZNaaFS9ZW51BFV1DfBR9XwH7T\
bbGd2mgxfA9bhFAiM"}'})*/

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
      let participantId = subjectInformation.externalId
      let participantLogin = subjectInformation.login
      let projectName = subjectInformation.project.projectName
      let sourceId = this.getSourceId(subjectInformation)
      let createdDate = new Date(subjectInformation.createdDate)
      let createdDateMidnight = this.schedule.setDateTimeToMidnight(new Date(subjectInformation.createdDate))
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
