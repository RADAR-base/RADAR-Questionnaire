import { Component, ViewChild, ElementRef } from '@angular/core'
import { ConfigService } from '../../providers/config-service';
import { StorageService } from '../../providers/storage-service';
import { AuthService } from '../../providers/auth-service';
import { StorageKeys } from '../../enums/storage'
import { NavController, Slides } from 'ionic-angular'
import { WeeklyReportSubSettings } from '../../models/settings'
import { DefaultSettingsWeeklyReport } from '../../assets/data/defaultConfig'
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
      orientation: 'portrait',
      disableAnimations: true
    }
    //this.scanner.scan(scanOptions).then((scannedObj) => this.authenticate(scannedObj))
    //TODO remove when finished
    this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi\
I0ZmZkZDUwMy03NDljLTQ0ZjctOGJlMi0zMTNmNDdiZDlmYWUiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiNGZmZGQ1MDMtNzQ5Yy00NGY3LThiZTItMzEzZjQ3Ym\
Q5ZmFlIiwicm9sZXMiOlsiUkFEQVItUGlsb3QtMDE6Uk9MRV9QQVJUSUNJUEFOVC\
JdLCJpc3MiOiJNYW5hZ2VtZW50UG9ydGFsIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV\
9QQVJUSUNJUEFOVCJdLCJjbGllbnRfaWQiOiJhUk1UIiwiYXVkIjpbInJlc19NYW\
5hZ2VtZW50UG9ydGFsIl0sInNjb3BlIjpbIkRVTU1ZX1NDT1BFIl0sImF0aSI6Ij\
k5Mjk3OGVjLTkwNzEtNDdkYi04YjgwLTk4Nzg4MjRmMzM3MCIsImV4cCI6MTUxNT\
U4ODI4NiwiaWF0IjoxNTEwNDA0Mjg2LCJqdGkiOiJiMWE5YzNkNy0zMDRmLTQ5ZT\
UtYjg4Zi01ZDZhYmUzNzJkMmYifQ.DtizhJ4-b9fsaf5V3uxTepR9HtVlu5c-2gh\
L7HsDSDXqiFrNz0ewuI38cUJCS4vgfyz-wzDzbrr2b4g-zNjpOMW_VUbJqmMGUKB\
p5cKU0_hlMNmyUTVRu-M4x6M4GOm-_hqu79bmN2w1vrMmXY4AtdCTVtJKwzJzkBx\
dx7ibeDpqsNlT45IJ1QDhvZwGUGJ6trRJhI7Ujl_sxX7bryTAh6CM-5PgdhRFmYp\
5gcl3gABsZTRz7Bps6S9d6RfG7qTH1uB8XVksEupEkLNJpyxkd6vwuwxIoVWFbi9\
4nffbZ304lmVAUiXduuybU1Pgp2eVQAeWUlc_KVnj1asv207iNpLphQIirIz6MtH\
3-mGIBXB_nOUxmr4mkPPOEdnDejHzqO5ZGS15lHyjCskVJOXFkWLMKniT2jEETMe\
QAK24oEhiZh-XmMRcqdOwiP6uGjt4z2yEEMrRQdnbEqaHMaHG8sM2zrBu9MhPGsg\
9u92fsJ7HS4_3FMruszTuXX5jw7JHk-uJsVRXWnYGF6NRpqflcYrT9YUj99Ndjw7\
2amrinaTlrN1sJuNRXWJ_Ds0xI3_3FobqKBfr317rwXj5zZVvoBqwqAfdrj635A5\
fDZbg3ey-M724VCGLtpJyPs7sQ1SM37pbO_4YRm0QANPUnkFsYKwVjXl2s1gu6W-\
xHLR0YLk"}'})
  }

  authenticate(authObj) {
    this.transitionStatuses()
    let auth = JSON.parse(authObj.text)
    this.authService.refresh(auth.refreshToken).then(() => {
      this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
        this.authService.registerAsSource().then(() => {
          this.retrieveSubjectInformation()
        })
      })
    })
  }

  retrieveSubjectInformation() {
    //TODO authenticate here
    this.authService.getSubjectInformation().then((res) => {
      let subjectInformation:any = res
      let participantId = subjectInformation.id
      let projectName = subjectInformation.project.projectName
      this.storage.init(participantId, projectName)
      this.doAfterAuthentication()
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
