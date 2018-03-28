import { Component } from '@angular/core';
import { Content, NavController, NavParams, ViewController } from 'ionic-angular'

@Component({
  selector: 'page-clinical-tasks',
  templateUrl: 'clinical-tasks.html',
})
export class ClinicalTasksPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ClinicalTasksPage');
  }

}
