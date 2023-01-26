import { Component } from '@angular/core'
import { ModalController, NavParams, Platform } from '@ionic/angular'

@Component({
  selector: 'cache-send-modal',
  templateUrl: 'cache-send-modal.component.html',
  styleUrls: ['cache-send-modal.component.scss']
})
export class CacheSendModalComponent {
  successes: any[]
  errors: Error[]
  result = []

  constructor(
    public platform: Platform,
    public params: NavParams,
    public modalCtrl: ModalController
  ) {
    this.result = this.params.get('data')
    this.errors = this.result.filter(d => d instanceof Error)
    this.successes = this.result.filter(d => !(d instanceof Error))
  }

  dismiss() {
    this.modalCtrl.dismiss()
  }

  segmentChanged(event) {}
}
