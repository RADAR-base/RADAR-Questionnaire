import { Component } from '@angular/core'
import { IonicModule, NavController } from '@ionic/angular'
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone'

@Component({
  selector: 'page-report',
  templateUrl: 'report-page.component.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class ReportPageComponent {
  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {}

  ionViewDidEnter() {}
}
