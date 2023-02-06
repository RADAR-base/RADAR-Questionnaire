import { Component } from '@angular/core'
import { NavParams, Platform, ViewController } from 'ionic-angular'

@Component({
  selector: 'cache-send-modal',
  templateUrl: 'cache-send-modal.component.html'
})
export class CacheSendModalComponent {
  successes: any[]
  errors: Error[]

  constructor(
    public platform: Platform,
    public params: NavParams,
    public viewCtrl: ViewController
  ) {
    const result = this.params.get('data')
    this.errors = result.filter(d => d instanceof Error)
    this.successes = result.filter(d => !(d instanceof Error))
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }
}
