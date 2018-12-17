import { Component, ElementRef, ViewChild } from '@angular/core'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { AlertController, NavController, Slides } from 'ionic-angular'

import {
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport,
  DefaultSourceTypeModel,
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  LanguageSetting,
  WeeklyReportSubSettings
} from '../../../shared/models/settings'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
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
  outcomeStatus: String
  reportSettings: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport;

  URLRegEx = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'

  language: LanguageSetting = {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  }
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages

  authSuccess = false


  constructor(
    public navCtrl: NavController,
    private scanner: BarcodeScanner,
    public storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private authService: AuthService,
    private translate: TranslatePipe,
    private alertCtrl: AlertController
  ) {}

  ionViewDidLoad() {
    this.slides.lockSwipes(true);
    this.translate.init()
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
      this.alertCtrl.create({
        title: "Consent is required",
        buttons: [{
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {}
        }],
        message: "Your consent to participate in the study is required."
      }).present();
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

  authenticate(authObj) {
    this.showOutcomeStatus = false
    this.transitionStatuses()

    new Promise((resolve, reject) => {
      let refreshToken = null
      // if (this.validURL(authObj)) {
        // NOTE: Meta QR code and new QR code
        this.authService
          .getRefreshTokenFromUrl(authObj)
          .then((body: any) => {
            refreshToken = body['refreshToken']
            if (body['baseUrl']) {
              this.storage.set(StorageKeys.BASE_URI, body['baseUrl'])
              this.authService.updateURI()
            }
            resolve(refreshToken)
          })
          .catch(e => {
            if (e.status === 410) {
              e.statusText = 'URL expired. Regenerate the QR code.'
            } else {
              e.statusText = 'Error: Cannot get the refresh token from the URL'
            }
            console.log(e.statusText + ' - ' + e.status)
            this.displayErrorMessage(e)
          })
      // } else {
      //   // NOTE: Old QR codes: containing refresh token as JSON
      //   this.authService.updateURI().then(() => {
      //     console.log('BASE URI : ' + this.storage.get(StorageKeys.BASE_URI))
      //     const auth = JSON.parse(authObj)
      //     refreshToken = auth['refreshToken']
      //     resolve(refreshToken)
      //   })
      // }
    })
      .catch(e => {
        console.error(
          'Cannot Parse Refresh Token from the QR code. ' +
            'Please make sure the QR code contains either a JSON or a URL pointing to this JSON ' +
            e
        )
        e.statusText = 'Cannot Parse Refresh Token from the QR code.'
        this.displayErrorMessage(e)
      })
      .then(refreshToken => {
        if (refreshToken === null) {
          const error = new Error('refresh token cannot be null.')
          this.displayErrorMessage(error)
          throw error
        }
        this.authService
          .registerToken(refreshToken)
          .then(() =>
            this.authService
              .registerAsSource()
              .then(() => this.authService.registerToken(refreshToken))
              .then(() => this.retrieveSubjectInformation())
              .catch(error => {
                const modifiedError = error
                this.retrieveSubjectInformation()
                modifiedError.statusText = 'Re-registered an existing source '
                this.displayErrorMessage(modifiedError)
              })
          )
          .catch(error => {
            this.displayErrorMessage(error)
          })
      })
      .catch(error => {
        this.displayErrorMessage(error)
      })
  }


  retrieveSubjectInformation() {
    this.authSuccess = true
    this.authService.getSubjectInformation().then(res => {

      const subjectInformation: any = res
      const participantId = subjectInformation.externalId
      const participantLogin = subjectInformation.login
      const projectName = subjectInformation.project.projectName
      // const sourceId = this.getSourceId(subjectInformation)
      const createdDate = new Date(subjectInformation.createdDate);
      const createdDateMidnight = this.schedule.setDateTimeToMidnight(
        createdDate
      )
      this.storage
        .init(
          participantId,
          participantLogin,
          projectName,
          // sourceId,
          this.language,
          createdDate,
          createdDateMidnight
        )
        .then(() => {
          this.doAfterAuthentication();
        })
    })
  }

  doAfterAuthentication() {
    this.configService.fetchConfigState(true).then(() => this.navigateToHome())
  }

  displayErrorMessage(error) {
    this.loading = false
    this.showOutcomeStatus = true
    const msg = error.statusText + ' (' + error.status + ')'
    this.outcomeStatus = msg
    this.transitionStatuses()
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

  getSourceId(response) {
    const sources = response.sources
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].sourceTypeModel === DefaultSourceTypeModel) {
        return sources[i].sourceId
      }
    }
    return 'Device not available'
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
    this.authService.keycloakLogin(false).then(success => {
    }, (error) => {
      console.log(error);
    });
  }

  loadUserInfo() {
    this.authService.loadUserInfo().then(
      user => alert(JSON.stringify(user))
    )
  }
}
