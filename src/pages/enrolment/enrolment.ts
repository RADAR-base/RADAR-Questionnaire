import { Component, ViewChild, ElementRef } from '@angular/core'
import { FirebaseService } from '../../providers/firebase-service';
import { StorageService } from '../../providers/storage-service'
import { StorageKeys } from '../../enums/storage'
import { NavController, Slides } from 'ionic-angular'
import { WeeklyReportSubSettings } from '../../models/settings'
import { DefaultSettingsWeeklyReport } from '../../assets/data/defaultConfig'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { HomePage } from '../home/home'

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
    private firebaseService: FirebaseService
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
    //this.authenticate('1223')
  }

  authenticate(authObj) {
    let authString = authObj.text
    this.transitionStatuses()
    //TODO authenticate here
    let patientId = authString
    this.storage.init(patientId)
    this.doAfterAuthentication()
  }

  doAfterAuthentication() {
    setTimeout(() => {
      this.loading = false
      this.showOutcomeStatus = true
      this.firebaseService.fetchConfigState()
      this.setOutcomeStatus(this.showOutcomeStatus)
      this.transitionStatuses()
    }, 1000)
  }

  weeklyReportChange(index) {
    this.reportSettings[index].show != this.reportSettings[index].show
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.reportSettings)
  }

  setOutcomeStatus(status) {
    if (status) {
      this.outcomeStatus = "Success"
      this.next()
    } else {
      this.outcomeStatus = "Registration failure"
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
