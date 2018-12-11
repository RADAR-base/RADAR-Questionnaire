import { Component, ViewChild } from '@angular/core';
import { AlertController, NavController, NavParams, Slides} from 'ionic-angular';
import {LanguageSetting} from "../../../../shared/models/settings";
import {LocKeys} from "../../../../shared/enums/localisations";
import {
  DefaultSettingsSupportedLanguages,
  LanguageMap
} from "../../../../../assets/data/defaultConfig";
import {StorageKeys} from "../../../../shared/enums/storage";
import {AppComponent} from "../../../../core/containers/app.component";
import {TranslatePipe} from "../../../../shared/pipes/translate/translate";
import {StorageService} from "../../../../core/services/storage.service";
import {EnrolmentPageComponent} from "../../containers/enrolment-page.component";

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
  languagesSelectable: LanguageSetting[] = DefaultSettingsSupportedLanguages;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private translate: TranslatePipe,
    public storage: StorageService,
    private alertCtrl: AlertController) {}

  ionViewDidLoad() {
    // this.slides.lockSwipes(true)
    this.translate.init()
  }

  ionViewDidEnter() {}

  showSelectLanguage() {
    const buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {}
      },
      {
        text: this.translate.transform(LocKeys.BTN_SET.toString()),
        handler: selectedLanguageVal => {
          const lang: LanguageSetting = {
            label: LanguageMap[selectedLanguageVal],
            value: selectedLanguageVal
          }
          this.storage.set(StorageKeys.LANGUAGE, lang).then(() => {
            this.language = lang
            this.translate.init().then(() => this.navCtrl.setRoot(AppComponent))
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
        label: this.translate.transform(
          this.languagesSelectable[i]['label'].toString()
        ),
        value: this.languagesSelectable[i]['value'],
        checked: checked
      })
    }
    this.showAlert({
      title: this.translate.transform(
        LocKeys.SETTINGS_LANGUAGE_ALERT.toString()
      ),
      buttons: buttons,
      inputs: inputs
    })
  }

  showAlert(parameters) {
    const alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if (parameters.message) {
      alert.setMessage(parameters.message)
    }
    if (parameters.inputs) {
      for (let i = 0; i < parameters.inputs.length; i++) {
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }

  goToRegistration() {
    this.navCtrl.setRoot(EnrolmentPageComponent);
  }
}
