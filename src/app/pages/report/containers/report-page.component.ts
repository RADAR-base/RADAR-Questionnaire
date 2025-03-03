import { Component } from '@angular/core'
import { NavController } from '@ionic/angular'
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone'

@Component({
  selector: 'app-page-report',
  templateUrl: 'report-page.component.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class ReportPageComponent {
  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {}

  ionViewDidEnter() {}
}
