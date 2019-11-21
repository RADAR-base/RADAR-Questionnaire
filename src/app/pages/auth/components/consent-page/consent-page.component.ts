import { Component, ViewChild } from '@angular/core'
import { NavController, Slides } from 'ionic-angular'
import { LanguageSetting } from "../../../../shared/models/settings";
import { AuthService } from "../../services/auth.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import { AlertService } from "../../../../core/services/misc/alert.service";
import { UsageService } from "../../../../core/services/usage/usage.service";
import { LogService } from "../../../../core/services/misc/log.service";
import { StorageService } from "../../../../core/services/storage/storage.service";
import { DefaultLanguage } from "../../../../../assets/data/defaultConfig";
import { LocKeys } from "../../../../shared/enums/localisations";
import { StorageKeys } from "../../../../shared/enums/storage";
import { EnrolmentEventType } from "../../../../shared/enums/events";
import { SplashPageComponent } from "../../../splash/containers/splash-page.component";
import { HomePageComponent } from "../../../home/containers/home-page.component";
import { WelcomePageComponent } from "../welcome-page/welcome-page.component";
import { EligibilityPageComponent } from "../eligibility-page/eligibility-page.component";
import { YesOrNoQuestion } from "../../../../shared/models/question";


@Component({
  selector: 'page-consent',
  templateUrl: 'consent-page.component.html'
})
export class ConsentPageComponent {
  @ViewChild(Slides)
  slides: Slides
  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: string

  questions: YesOrNoQuestion[]
  evaluatedQuestions: Map<number, YesOrNoQuestion>

  totalNumberOfConsentsRequired: number = 2
  isSubmitConsentDisabled = true

  showTimeCommitmentDetails = false
  showPrivacyPolicyDetails = false
  showWithdrawalDetails = false
  showContactYouDetails = false

  language?: LanguageSetting = DefaultLanguage

  constructor(
    public navCtrl: NavController,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService,
    private storage: StorageService,
  ) {
    this.localization.update().then(lang => (this.language = lang))
    this.questions = [
      {
        questionId: 1,
        isAnswered: false,
        question: "I consent (agree) to take part in the Health on the MovE (HOME) Study",
        answer: undefined
      },
      {
        questionId: 2,
        isAnswered: false,
        question: "I consent (agree) to the collection of data about my physical, mental and sexual health",
        answer: undefined
      }
    ];
    this.evaluatedQuestions = new Map<number, YesOrNoQuestion>()
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

  processConsent() {
    if (this.evaluatedQuestions.size === this.totalNumberOfConsentsRequired) {
      const hasConsent = Array.from(this.evaluatedQuestions.values())
        .filter(
          d => {
            return (
              d.answer === false
            )
          }).length === 0

      if (hasConsent) {
        this.usage.sendGeneralEvent(EnrolmentEventType.CONSENT_RECEIVED)
        this.storage.set(StorageKeys.CONSENT_ACCESS_NHS_RECORDS, true);
        this.authenticate();
      } else {
        this.usage.sendGeneralEvent(EnrolmentEventType.CONSENT_NOT_RECEIVED)
        this.alertService.showAlert({
          title: "Consent is required",
          buttons: [{
            text: this.localization.translateKey(LocKeys.BTN_OKAY),
            handler: () => {}
          }],
          message: "Your consent to participate in the study is at least required."
        })
      }
    }
  }

  slideTo(index: number) {
    this.slides.lockSwipes(false)
    this.slides.slideTo(index, 500)
    this.slides.lockSwipes(true)
  }

  authenticate() {
    // this.usage.sendGeneralEvent(EnrolmentEventType.ELIGIBILITY_MET)
    this.loading = true
    this.clearStatus()
    this.auth
      .authenticate(true)
      .catch(e => {
        this.handleError(e)
        this.loading = false
      })
      .then(() => this.auth.initSubjectInformation())
      .then(() => {
        this.usage.sendGeneralEvent(EnrolmentEventType.SUCCESS)
        this.navigateToSplash()
      })
      .catch(e => {
        this.handleError(e)
        this.loading = false
        this.alertService.showAlert({
                  title: "Something went wrong",
                  buttons: [{
                    text: this.localization.translateKey(LocKeys.BTN_OKAY),
                    handler: () => {}
                  }],
                  message: "Could not successfully register new participant. Please try again later."
                });
      })
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

  navigateToSplash() {
    this.navCtrl.setRoot(SplashPageComponent)
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePageComponent)
  }

  navigateToWelcome() {
    this.navCtrl.setRoot(WelcomePageComponent)
  }

  navigateToEligibility() {
    this.navCtrl.setRoot(EligibilityPageComponent)
  }

  onValueChange(event: YesOrNoQuestion) {
    // NOTE: On init the component fires the event once
    if (event === undefined) {
      return
    }
    this.evaluatedQuestions.set(event.questionId, event)
    // if total number of res questions are answered
    if (this.evaluatedQuestions.size === this.totalNumberOfConsentsRequired) {
      this.isSubmitConsentDisabled = false
    }
  }
}
