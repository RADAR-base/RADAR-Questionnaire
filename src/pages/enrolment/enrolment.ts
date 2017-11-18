import { Component, ViewChild, ElementRef } from '@angular/core'
import { ConfigService } from '../../providers/config-service';
import { StorageService } from '../../providers/storage-service';
import { AuthService } from '../../providers/auth-service';
import { StorageKeys } from '../../enums/storage'
import { NavController, Slides } from 'ionic-angular'
import { WeeklyReportSubSettings } from '../../models/settings'
import { DefaultSettingsWeeklyReport , DefaultDeviceTypeModel} from '../../assets/data/defaultConfig'
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
I5ODIzYjliNi1lZTE4LTRmNjctOTBlYS04NTFkNjAwZmVhY2MiLCJzb3VyY2VzIj\
pbXSwidXNlcl9uYW1lIjoiOTgyM2I5YjYtZWUxOC00ZjY3LTkwZWEtODUxZDYwMG\
ZlYWNjIiwicm9sZXMiOlsiUkFEQVItUGlsb3QtMDE6Uk9MRV9QQVJUSUNJUEFOVC\
JdLCJpc3MiOiJNYW5hZ2VtZW50UG9ydGFsIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV\
9QQVJUSUNJUEFOVCJdLCJjbGllbnRfaWQiOiJhUk1UIiwiYXVkIjpbInJlc19NYW\
5hZ2VtZW50UG9ydGFsIl0sInNjb3BlIjpbIkRVTU1ZX1NDT1BFIl0sImF0aSI6Im\
U2OTY3YTgwLWFmOTUtNDRjNy04YzJjLTllYzJhYTc0NGE0YyIsImV4cCI6MTUxNT\
c1ODQyNiwiaWF0IjoxNTEwNTc0NDI2LCJqdGkiOiIyOWVkODUwMC1kMGRkLTRkMj\
ktYmFiOC02N2M1YmMxYmE4OTgifQ.YIZ1SbnQ2uEllpOFmVX0HVs8f02xwkqw5F5\
a59jvOvXXiWWWJk617wQpHy4ETHA8w1OhX7kHANd6ZzlQ68qmHY1PQR7uwsSPY0e\
df3-o1UtDKzgv44ktGHe-LNJMzW6obfdG12GmdA-c-af7lC26JtolspqfpYCdCtp\
tBKipF3S8n5mhWwBartGWJomNkWXo2aAoP1jfDQQoL8d8I8BXON4jS4uhQWY9Ain\
taTUh6K9kiFhVF-UFmlgTNZzTXsfy1hSU3JQQB-15Jk09JGe2iKFbwXHyrPddupW\
3lTeabCXZk3Wmi1ZZ6PwsHY4oCvuAT6h_c25Ga8VovQJndbRkgsyIQzm3FBz110p\
C6xFkcIpr7Dr4ykilyR7YfQT-VqZtxjvQCjs7t5ipCyTTIGV2LSc_q6i2umwxdER\
Jt5ttNSCs7Oq73iVfnTl-G0kNeAuCj_D1CqdTc3qIwRPD7-D_PKB_KTtCeefDbTa\
EYybX_ieVoetJ7e8a7Jb2KJIDqCDOkl5hLsiniOo4R04kQQ9igwjUo9E0Bpw4PpI\
i-PzW4j7hPO31v2E0h0ziGzybBWpCBwNxOpv89gIWH7ZuVIn_mFemo8hgf7YgLs1\
kil0Xx3YMIbDpvPEGeoBMgTJ9a99699sNkmT3DVPkQWt38z4B6dniB85GFg_ghE9\
4XNFLyEY"}'})
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
      if(sources[i].deviceTypeModel == DefaultDeviceTypeModel) {
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
