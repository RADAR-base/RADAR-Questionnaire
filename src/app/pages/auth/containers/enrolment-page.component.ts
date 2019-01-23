import { Component, ElementRef, ViewChild } from '@angular/core'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { NavController, Slides } from 'ionic-angular'

import { DefaultSettingsWeeklyReport} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/alert.service'
import { ConfigService } from '../../../core/services/config.service'
import { LocalizationService } from '../../../core/services/localization.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  LanguageSetting,
  WeeklyReportSubSettings
} from '../../../shared/models/settings'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { AuthService } from '../services/auth.service'

@Component({
  selector: 'page-enrolment',
  templateUrl: 'enrolment-page.component.html'
})
export class EnrolmentPageComponent {
  @ViewChild(Slides)
  slides: Slides
  @ViewChild('loading')
  elLoading: ElementRef
  @ViewChild('outcome')
  elOutcome: ElementRef
  isEighteen: boolean = undefined;
  isBornInUK: boolean = undefined;
  consentParticipation = undefined;
  consentNHSRecordAccess = undefined;
  showTimeCommitmentDetails = false;
  showPrivacyPolicyDetails = false;
  showWithdrawalDetails = false;
  showContactYouDetails = false;
  loading: boolean = false
  showOutcomeStatus: boolean = false
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport;

  language?: LanguageSetting

  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    public storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private authService: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService
  ) {}

  ionViewDidLoad() {
    this.slides.lockSwipes(true)
    return this.localization.update()
      .then(lang => (this.language = lang))
  }

  ionViewDidEnter() {}

  isOlderThanEighteen(res: boolean) {
    this.isEighteen = res;
    this.processEligibility();
  }

  isBornInUnitedKingdom(res: boolean) {
    this.isBornInUK = res;
    this.processEligibility();
  }

  processConsent() {
    if (!this.consentParticipation) {
      this.alertService.showAlert({
        title: "Consent is required",
        buttons: [{
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {}
        }],
        message: "Your consent to participate in the study is at least required."
      })
    }
    if(this.consentParticipation === true) {
      this.goToRegistration();
    }
    if(this.consentNHSRecordAccess === true) {
      this.storage.set(StorageKeys.CONSENT_ACCESS_NHS_RECORDS, true);
    }
  }

  processEligibility() {
    if(this.isBornInUK != undefined && this.isEighteen != undefined) {
      if(this.isBornInUK === true && this.isEighteen == true){
        this.next();
      } else {
        this.slideTo(2);
      }
    }
  }

  weeklyReportChange(index) {
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.reportSettings)
  }

  transitionStatuses() {
    if (this.loading) {
      this.elOutcome.nativeElement.style.opacity = 0
      this.elLoading.nativeElement.style.opacity = 1
    }
    if (this.showOutcomeStatus) {
      this.elOutcome.nativeElement.style.transform = 'translate3d(-100%,0,0)'
      this.elOutcome.nativeElement.style.opacity = 1
      this.elLoading.nativeElement.style.opacity = 0
    }
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

  slideTo(index: number) {
    this.slides.lockSwipes(false)
    this.slides.slideTo(index, 500)
    this.slides.lockSwipes(true)
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePageComponent)
  }

  goToRegistration() {
    this.loading = true;
    this.authService.keycloakLogin(false)
      .then(() => {
        return this.authService.retrieveUserInformation(this.language)
      })
      .then(() => this.configService.fetchConfigState(true))
      .then(() => this.navigateToHome())
      .catch( () => {
        this.loading = false;
        this.alertService.showAlert({
          title: "Something went wrong",
          buttons: [{
            text: this.localization.translateKey(LocKeys.BTN_OKAY),
            handler: () => {}
          }],
          message: "Could not successfully register new participant. Please try again later."
        });
      });
  }
}
