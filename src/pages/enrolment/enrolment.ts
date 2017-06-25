import { Component, ViewChild, ElementRef } from '@angular/core'
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
  authString: String
  outcomeStatus: String
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport

  constructor (
    public navCtrl: NavController,
    private scanner: BarcodeScanner
  ) {

    // TODO check for existing data
    //this.navCtrl.setRoot(HomePage)

  }

  ionViewDidLoad () {
    this.slides.lockSwipes(true)
  }

  ionViewDidEnter () {
  }

  scan () {
    this.loading = true
    this.authenticate('1223')
    let scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait',
      disableAnimations: true
    }
    //this.scanner.scan(scanOptions).then((scannedObj) => this.authenticate(scannedObj))
  }

  authenticate (authObj) {
    this.transitionStatuses()
    //TODO authenticate here
    setTimeout(() => {
      this.authString = authObj.text
      this.loading = false
      this.showOutcomeStatus = true
      this.setOutcomeStatus(this.showOutcomeStatus)
      this.transitionStatuses()
    }, 1000)
  }

  weeklyReportChange () {
    
  }

  setOutcomeStatus(status) {
    if(status) {
      this.outcomeStatus = "Success"
      this.next()
    } else {
      this.outcomeStatus = "Registration failure"
    }
  }

  transitionStatuses () {
    if(this.loading){
      this.elLoading.nativeElement.style.opacity = 1
    }
    if(this.showOutcomeStatus) {
      this.elOutcome.nativeElement.style.transform =
      'translate3d(-100%,0,0)'
      this.elOutcome.nativeElement.style.opacity = 1
      this.elLoading.nativeElement.style.opacity = 0
    }
  }

  next () {
    this.slides.lockSwipes(false)
    let slideIndex = this.slides.getActiveIndex() + 1
    this.slides.slideTo(slideIndex, 500)
    this.slides.lockSwipes(true)
  }

  navigateToHome () {
    this.navCtrl.setRoot(HomePage)
  }
}
