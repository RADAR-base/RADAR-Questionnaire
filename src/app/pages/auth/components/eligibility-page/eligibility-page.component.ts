import { Component, ViewChild } from '@angular/core'
import { NavController, Slides } from 'ionic-angular'
import { HomePageComponent } from "../../../home/containers/home-page.component";
import { AuthService } from "../../services/auth.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import { AlertService } from "../../../../core/services/misc/alert.service";
import { UsageService } from "../../../../core/services/usage/usage.service";
import { LogService } from "../../../../core/services/misc/log.service";
import { EnrolmentEventType } from "../../../../shared/enums/events";
import { WelcomePageComponent } from "../welcome-page/welcome-page.component";
import { ConsentPageComponent } from "../consent-page/consent-page.component";
import { YesOrNoQuestion } from "../../../../shared/models/auth";

@Component({
  selector: 'page-eligibility',
  templateUrl: 'eligibility-page.component.html'
})
export class EligibilityPageComponent {
  @ViewChild(Slides)
  slides: Slides
  loading: boolean = false
  showOutcomeStatus: boolean = false

  isNextButtonDisabled = true
  outcomeStatus: string

  questions: YesOrNoQuestion[]
  evaluatedQuestions: Map<number, YesOrNoQuestion>

  totalNumberOfEligibilityConditions: number = 3

  constructor(
    public navCtrl: NavController,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService,
  ) {
    this.questions = [
      {
        questionId: 1,
        isAnswered: false,
        question: "Are you at least 18 years old?",
        answer: undefined
      },
      {
        questionId: 2,
        isAnswered: false,
        question: "Were you born outside of the United Kingdom?",
        answer: undefined
      },
      {
        questionId: 3,
        isAnswered: false,
        question: "Are you planning to move to the UK in the next 6 months or currently living in the UK?",
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

  processEligibility() {
    if (this.evaluatedQuestions.size === this.totalNumberOfEligibilityConditions) {
      const isEligible = Array.from(this.evaluatedQuestions.values())
        .filter(
        d => {
          return (
            d.answer === false
          )
        }).length === 0

      if (isEligible) {
        this.usage.sendGeneralEvent(EnrolmentEventType.ELIGIBILITY_MET)
        this.navigateToConsentPage();
      } else {
        this.usage.sendGeneralEvent(EnrolmentEventType.ELIGIBILITY_NOT_MET)
        this.next()
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

  onValueChange(event: YesOrNoQuestion) {
    // NOTE: On init the component fires the event once
    if (event === undefined) {
      return
    }
    this.evaluatedQuestions.set(event.questionId, event)
    // if total number of questions are answered
    if (this.evaluatedQuestions.size === this.totalNumberOfEligibilityConditions) {
      this.isNextButtonDisabled = false
    }
  }

}
