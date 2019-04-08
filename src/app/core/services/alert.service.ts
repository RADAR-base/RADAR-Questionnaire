import { Injectable } from '@angular/core'
import { AlertController, AlertOptions } from 'ionic-angular'

@Injectable()
export class AlertService {
  constructor(private alertCtrl: AlertController) {}

  /**
   * Present the alert instance.
   *
   * @param {AlertOptions} [parameters={}] Alert options
   * @returns {Promise} Returns a promise which is resolved when the transition has completed.
   */
  showAlert(parameters?: AlertOptions): Promise<any> {
    const alert = this.alertCtrl.create(parameters)
    return alert.present()
  }
}
