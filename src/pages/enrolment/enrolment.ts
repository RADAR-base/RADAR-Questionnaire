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

  // AUTHENTICATION
  authStr: string = "Auth TEST"

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    private storage: StorageService,
    private configService: ConfigService,
    private authService: AuthService
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
    this.authenticate({'text':'{"refreshToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMTczMWU3Zi1mYmUwLTRkOWMtYTU4Ni00ODQzM2E2NmJlYTkiLCJzb3VyY2VzIjpbXSwidXNlcl9uYW1lIjoiZjE3MzFlN2YtZmJlMC00ZDljLWE1ODYtNDg0MzNhNjZiZWE5Iiwicm9sZXMiOlsiUmFkYXItUGlsb3QtMDE6Uk9MRV9QQVJUSUNJUEFOVCJdLCJpc3MiOiJNYW5hZ2VtZW50UG9ydGFsIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9QQVJUSUNJUEFOVCJdLCJjbGllbnRfaWQiOiJhUk1UIiwiYXVkIjpbInJlc19NYW5hZ2VtZW50UG9ydGFsIl0sInNjb3BlIjpbIkRVTU1ZX1NDT1BFIl0sImF0aSI6IjdlMmI2Y2RhLWRlZmMtNDc5Zi1hZDI0LWU1MTg0NTM3MzJhZiIsImV4cCI6MTUxNTI1MjEwNSwiaWF0IjoxNTEwMDY4MTA1LCJqdGkiOiJjODgzZjYzYS0zMGYxLTQ1MmUtOWZiZS1lZGFmN2RlZmM2YmUifQ.CMgUx0RaKdvShnmoCndsJRgtC8cCqKbYbH9eyHY5LREdD286OkkHldGWelEJI740S5wTFWB3nDoluVIdF7kzveAXPHnPOOWSnVCdy5GrNu2s5Q3xUinfVCkZ7PB9vDx8SGm1oa7rQ_ZYdG-GfGJyhoMPEsVs-WeumwSfZnlz0dZcbln2StpaFOu8liqdD4n_yiybOlfZlaxVKp5-0hZlw1UGZfCk3VMKHknnqwxAR8r3trF7AEEJXPlOzWcCVHnFmwuEPGMOmoN8zhD5nhaE57CIKaIoYm-pYSy-4VcBmCXiHBIBqbNvQSZ0uayohwGavqR6PU-nIjOlBaW4vflmDrPuAExVcZ6iwYJObyEK8ZVYSFw_-6_gpAxemMS7hOd_qO4tLCwMoAAu7ky5U2Goxaple_ZLjliMsvjU6cUY8WIzd92oKgHDbdVgfgeNLmfY_3evnFsowe12-LLeprTkFUMetFwGUXRnim2Wp4Ss5Or0eDCYMltFSDh6riy781d3vZTY9GKo3FYqS706dHclMEcb96tHpwpvCvlZmb75L9kd7gixyllywXQoIZmjDqW0btKbNnrSDr8zgOfMugi5DZ_qCMm9iFOVs5nK-5uC4nQouEvNIjgjKA-bbR9YvOC8UxDjF4Dpk3S6uU77Im4dJuwMFpSxa2zy7Ko"}'})
  }

  authenticate(authObj) {
    let auth = JSON.parse(authObj.text)
    this.authService.refresh(auth.refreshToken).then(() => {
      this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
        console.log(tokens)
        this.retrievePatientInformation()
      })
    })
  }

  retrievePatientInformation() {
    this.transitionStatuses()
    //TODO authenticate here
    this.authService.getProjectInformation()
    let patientId = "TESTING"
    this.storage.init(patientId)
    this.doAfterAuthentication()
  }

  doAfterAuthentication() {
    this.loading = false
    this.showOutcomeStatus = true
    this.configService.fetchConfigState()
    // FOR AUTHENTICATION AUTTOMATIC TRANSITION OFF
    //this.setOutcomeStatus(this.showOutcomeStatus)
    //this.transitionStatuses()
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
