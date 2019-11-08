import {Component, Input, ViewChild} from '@angular/core'
import { NavController, Slides } from 'ionic-angular'
import { LanguageSetting } from "../../../../shared/models/settings";
import { AuthService } from "../../services/auth.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import { AlertService } from "../../../../core/services/misc/alert.service";
import { UsageService } from "../../../../core/services/usage/usage.service";
import { LogService } from "../../../../core/services/misc/log.service";
import { StorageService } from "../../../../core/services/storage/storage.service";
import { ConfigService } from "../../../../core/services/config/config.service";
import { DefaultLanguage } from "../../../../../assets/data/defaultConfig";
import { LocKeys } from "../../../../shared/enums/localisations";
import { StorageKeys } from "../../../../shared/enums/storage";
import { EnrolmentEventType } from "../../../../shared/enums/events";
import { SplashPageComponent } from "../../../splash/containers/splash-page.component";
import { HomePageComponent } from "../../../home/containers/home-page.component";
import { WelcomePageComponent } from "../welcome-page/welcome-page.component";
import { EligibilityPageComponent } from "../eligibility-page/eligibility-page.component";


@Component({
  selector: 'page-consent-item',
  templateUrl: 'consent-page-item.component.html'
})
export class ConsentPageItemComponent {

  showDetail = false
  @Input()
  md: string

  @Input()
  title: string

  @Input()
  consentDetailText: string

  language?: LanguageSetting = DefaultLanguage

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
    this.localization.update().then(lang => (this.language = lang))
  }

  ionViewDidLoad() {

    this.usage.setPage(this.constructor.name)
  }

}
