import { Component, Input } from '@angular/core'
import { NavController } from 'ionic-angular'
import {LanguageSetting} from "../../../../shared/models/settings";
import {DefaultLanguage} from "../../../../../assets/data/defaultConfig";
import {LocalizationService} from "../../../../core/services/misc/localization.service";
import {UsageService} from "../../../../core/services/usage/usage.service";


@Component({
  selector: 'learning-item',
  templateUrl: 'learning-page-item.component.html'
})
export class LearningPageItemComponent {

  showDetail = false

  @Input()
  currentItem: any = {}

  language?: LanguageSetting = DefaultLanguage

  constructor(
    public navCtrl: NavController,
    private localization: LocalizationService,
    private usage: UsageService,
  ) {
    this.localization.update().then(lang => (this.language = lang))
  }

  ionViewDidLoad() {
    this.usage.setPage(this.constructor.name)
  }
}
