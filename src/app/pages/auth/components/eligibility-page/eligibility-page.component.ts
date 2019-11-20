import { Component, ViewChild } from '@angular/core'
import { NavController, Slides } from 'ionic-angular'
import { HomePageComponent } from "../../../home/containers/home-page.component";
import { AuthService } from "../../services/auth.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import { AlertService } from "../../../../core/services/misc/alert.service";
import { UsageService } from "../../../../core/services/usage/usage.service";
import { LogService } from "../../../../core/services/misc/log.service";
import { StorageService } from "../../../../core/services/storage/storage.service";
import { ConfigService } from "../../../../core/services/config/config.service";
import { EnrolmentEventType } from "../../../../shared/enums/events";
import { WelcomePageComponent } from "../welcome-page/welcome-page.component";
import { ConsentPageComponent } from "../consent-page/consent-page.component";

@Component({
  selector: 'page-eligibility',
  templateUrl: 'eligibility-page.component.html'
})
export class EligibilityPageComponent {
  @ViewChild(Slides)
  slides: Slides
  loading: boolean = false
  showOutcomeStatus: boolean = false

  isEighteen: boolean = undefined
  isBornOutOfUK: boolean = undefined
  willMoveToUK: boolean = undefined

  isQuestionOneAnswered = false
  isQuestionTwoAnswered = false
  isQuestionThreeAnswered = false
  outcomeStatus: string

  constructor(
    public navCtrl: NavController,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService,
    private storage: StorageService,
    private config: ConfigService,
  ) {

  }

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
    this.usage.setPage(this.constructor.name)
  }

  next() {
    this.slides.lockSwipes(false)
    const slideIndex = this.slides.getActiveIndex() + 1
    this.slides.slideTo(slideIndex, 500)
    this.slides.lockSwipes(true)
  }

  goBack() {
    this.slides.lockSwipes(false)
    const slideIndex = this.slides.getActiveIndex() - 1
    this.slides.slideTo(slideIndex, 500)
    this.slides.lockSwipes(true)
  }

  isOlderThanEighteen(res: boolean) {
    this.isQuestionOneAnswered = true
    this.isEighteen = res;
  }

  isBornOutOfUnitedKingdom(res: boolean) {
    this.isQuestionTwoAnswered = true
    this.isBornOutOfUK = res;
  }

  isMovingToUK(res: boolean) {
    this.isQuestionThreeAnswered = true
    this.willMoveToUK = res;
  }

  processEligibility() {
    if(this.isBornOutOfUK != undefined && this.isEighteen != undefined && this.willMoveToUK != undefined) {
      if(this.isBornOutOfUK === true && this.isEighteen == true && this.willMoveToUK === true){
        this.navigateToConsentPage();
      } else {
        this.next();
      }
    }
  }

  slideTo(index: number) {
    this.slides.lockSwipes(false)
    this.slides.slideTo(index, 500)
    this.slides.lockSwipes(true)
  }

  handleError(e) {
    this.logger.error('Failed to register', e)
    this.showStatus()
    this.outcomeStatus =
      e.error && e.error.message
        ? e.error.message
        : e.statusText + ' (' + e.status + ')'
    this.usage.sendGeneralEvent(
      e.status == 409 ? EnrolmentEventType.ERROR : EnrolmentEventType.FAIL,
      {
        error: this.outcomeStatus
      }
    )
  }

  clearStatus() {
    this.showOutcomeStatus = false
  }

  showStatus() {
    setTimeout(() => (this.showOutcomeStatus = true), 500)
  }

  navigateToConsentPage() {
    this.navCtrl.setRoot(ConsentPageComponent)
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePageComponent)
  }

  navigateToWelcome() {
    this.navCtrl.setRoot(WelcomePageComponent)
  }

  onValueChange(event: any) {
    // NOTE: On init the component fires the event once
    if (event === undefined) {
      return
    }
    console.log('Test value change emit ', event)
    // this.value = event
    // this.emitAnswer()
  }

}
