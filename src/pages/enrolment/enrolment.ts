import { Component, ViewChild, ElementRef } from '@angular/core'
import { ConfigService } from '../../providers/config-service';
import { StorageService } from '../../providers/storage-service';
import { AuthService } from '../../providers/auth-service';
import { StorageKeys } from '../../enums/storage'
import { NavController, Slides } from 'ionic-angular'
import { WeeklyReportSubSettings } from '../../models/settings'
import { DefaultSettingsWeeklyReport , DefaultSourceTypeModel} from '../../assets/data/defaultConfig'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { HomePage } from '../home/home'
import { LocKeys } from '../../enums/localisations'
import { JwtHelper } from 'angular2-jwt'

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

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    private storage: StorageService,
    private configService: ConfigService,
    private authService: AuthService,
    private jwtHelper: JwtHelper
  ) {
  }

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
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
    /*
    //TODO remove when finished
    this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
JjM2U2NzZkNS05YzBlLTQxY2YtODljZC05M2U3NWU2YjM0YTQiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiYzNlNjc2ZDUtOWMwZS00MWNmLTg5Y2QtOTNlNzVlNm\
IzNGE0Iiwicm9sZXMiOlsiUkFEQVItTURELXMxOlJPTEVfUEFSVElDSVBBTlQiXS\
wiaXNzIjoiTWFuYWdlbWVudFBvcnRhbCIsImF1dGhvcml0aWVzIjpbIlJPTEVfUE\
FSVElDSVBBTlQiXSwiY2xpZW50X2lkIjoiYVJNVCIsImF1ZCI6WyJyZXNfTWFuYW\
dlbWVudFBvcnRhbCJdLCJzY29wZSI6WyJEVU1NWV9TQ09QRSJdLCJhdGkiOiJlYz\
Q5OGMwYy0xYjc2LTRkZjktOTJlOS00MDIzODlhNzVjNjUiLCJleHAiOjE1MTY4OT\
gwODQsImlhdCI6MTUxMTcxNDA4NCwianRpIjoiZDhiZjEzYTYtOWFmNi00NDdjLT\
g1NjktNWQzMGNhYWViNjRlIn0.Zj7CR5d8Kt0Xc-p16Y3jnYsd_2CTE3EH2lyIgI\
JlT8DkmfleTsCuDq-W3okh5wPBaUcert_ZNUTj7T9Q3CPEfCp5LqcG-L2awPdCos\
vN6pSHhFXKYQ-5NbNed02ARhWfVhrpdh_5mJSWxOQOMAbB3FdxYKB0Hhjzvo4G6o\
XbX-sXrz1N4Bad2nPA0INyIOfZpz-yBsHRIeRWaIcxmdRqVdtPsHrdvQRVwipZOL\
50mZFNBLMmpSbaqKZe4ue64-PVT67D3KIeToyky7OANuvP7f5Hj0o4AW7WwQk-9b\
YX5JZmNH0oHXXVBtuiRf7rWzfLBLrZ4ddY69eqCXT_XM7VhMWrgrUJBtkt2I_bsB\
7VPqgEQ5wAUKKAbgxaVsfYrCmj2FvYjU6wuKIS3B0_ehPTdzezujbGK0LdrBs-iY\
sTpmO3cs8pN0z-sL_fptzjS_X8-DezkaoJtGIy0XQbyZbwc5bA_uJdAONyoKxZWY\
yEnLthsUVx86KTppGZJ11Em7B6od0gGqF88NF6lHko6Un2Kt6u2ViHNBi5NgsDoD\
x9FRX9ZfrYiaBT3X3YdyS1ctk9e2mHfgygRtXd1JR9n8gVdTId2V2FcUNiNZl-z4\
HuMDkz7HBd5l8fJcNGAoFoVKE7RfKGoewdTNsaRXnYDTk_JxmpOxZFVaTX6yo2D8\
enrcg"}'})*/
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
      console.log(res)
      let subjectInformation:any = res
      let participantId = subjectInformation.id
      let participantLogin = subjectInformation.login
      let projectName = subjectInformation.project.projectName
      let sourceId = this.getSourceId(subjectInformation)
      let createdDate = subjectInformation.createdDate
      this.storage.init(participantId,
        participantLogin,
        projectName,
        sourceId,
        createdDate)
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
      if(sources[i].deviceTypeModel == DefaultSourceTypeModel) {
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
}
