import { Component, Input } from '@angular/core'
import { NavController } from 'ionic-angular'
import { LanguageSetting } from "../../../../shared/models/settings";
import { AuthService } from "../../services/auth.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import { AlertService } from "../../../../core/services/misc/alert.service";
import { UsageService } from "../../../../core/services/usage/usage.service";
import { DefaultLanguage } from "../../../../../assets/data/defaultConfig";


@Component({
  selector: 'page-consent-item',
  templateUrl: 'consent-page-item.component.html'
})
export class ConsentPageItemComponent {

  showDetail = false

  @Input()
  currentItem: any = {}

  language?: LanguageSetting = DefaultLanguage

  constructor(
    public navCtrl: NavController,
    private auth: AuthService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
  ) {
    this.localization.update().then(lang => (this.language = lang))
  }

  ionViewDidLoad() {
    this.usage.setPage(this.constructor.name)
  }

}
