import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';

import { DefaultSettingsSupportedLanguages, LanguageMap } from "../../../../../assets/data/defaultConfig";
import { AppComponent } from "../../../../core/containers/app.component";
import { StorageService } from "../../../../core/services/storage/storage.service";
import { LocKeys } from "../../../../shared/enums/localisations";
import { StorageKeys } from "../../../../shared/enums/storage";
import { LanguageSetting } from "../../../../shared/models/settings";
import { HomePageComponent } from "../../../home/containers/home-page.component";
import { EnrolmentPageComponent } from "../../containers/enrolment-page.component";
import { AuthService } from "../../services/auth.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import { AlertService } from "../../../../core/services/misc/alert.service";
import { ConfigService } from "../../../../core/services/config/config.service";

/**
 * Generated class for the WelcomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome-page.component.html',
})
export class WelcomePageComponent {

  @ViewChild(Slides)
  slides: Slides;

  language: LanguageSetting = {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  }
  loading: boolean = false
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages;

  constructor(
    private navCtrl: NavController,
    private localization: LocalizationService,
    private storage: StorageService,
    private configService: ConfigService,
    private authService: AuthService,
    private alertService: AlertService) {}

  ionViewDidLoad() {
    return this.localization.update()
  }

  ionViewDidEnter() {}

  showSelectLanguage() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_CANCEL),
        handler: () => {}
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_SET),
        handler: selectedLanguageVal => {
          const lang: LanguageSetting = {
            label: LanguageMap[selectedLanguageVal],
            value: selectedLanguageVal
          }
          this.storage.set(StorageKeys.LANGUAGE, lang).then(() => {
            this.language = lang
            this.localization.update()
              .then(() => this.navCtrl.setRoot(AppComponent))
          })
        }
      }
    ]
    const inputs = []
    for (let i = 0; i < this.languagesSelectable.length; i++) {
      let checked = false
      if (this.languagesSelectable[i]['label'] === this.language.label) {
        checked = true
      }
      inputs.push({
        type: 'radio',
        label: this.localization.translate(this.languagesSelectable[i].label),
        value: this.languagesSelectable[i].value,
        checked: checked
      })
    }
    this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SETTINGS_LANGUAGE_ALERT),
      buttons: buttons,
      inputs: inputs
    })
  }



  joinStudy() {
    this.navCtrl.setRoot(EnrolmentPageComponent);
  }

  goToLogin() {
    this.loading = true;
    this.authService.keycloakLogin(true)
      .then(() => this.authService.retrieveUserInformation(this.language))
      .then(() => this.configService.fetchConfigState(true))
      .catch( () => {
        this.loading = false;
        this.alertService.showAlert({
          title: "Could not retrieve configuration",
          buttons: [{
            text: this.localization.translateKey(LocKeys.BTN_OKAY),
            handler: () => {}
          }],
          message: "Could not retrieve questionnaire configuration. Please try again later."
        })
      })
      .then(() => this.navigateToHome())
      .catch( () => {
        this.loading = false;
        this.alertService.showAlert({
          title: "Something went wrong",
          buttons: [{
            text: this.localization.translateKey(LocKeys.BTN_OKAY),
            handler: () => {}
          }],
          message: "Could not successfully redirect to login. Please try again later."
        })
      });
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePageComponent)
  }

}
