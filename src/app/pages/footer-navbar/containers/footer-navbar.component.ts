import { Component } from '@angular/core'
import {SettingsPageComponent} from "../../settings/containers/settings-page.component";
import {NavController} from "ionic-angular";
import {HomePageComponent} from "../../home/containers/home-page.component";
import {LearnPageComponent} from "../../learn/containers/learn-page.component";

@Component({
  selector: 'footer-navbar',
  templateUrl: 'footer-navbar.component.html'
})
export class FooterNavbarComponent{

  constructor(
    public navCtrl: NavController,

  ) {}

  openSettingsPage() {
    this.navCtrl.push(SettingsPageComponent)
  }

  openLearnPage() {
    this.navCtrl.push(LearnPageComponent)
  }

  openSurveysPage() {
    this.navCtrl.push(HomePageComponent)
  }
}
