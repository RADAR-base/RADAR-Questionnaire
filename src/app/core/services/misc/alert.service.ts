import { Injectable } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { AlertOptions } from '@ionic/core'

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(private alertCtrl: AlertController) {}

  /**
   * Present the alert instance.
   *
   * @param {AlertOptions} [parameters={}] Alert options
   * @returns {Promise} Returns a promise which is resolved when the transition has completed.
   */
  async showAlert(parameters?: AlertOptions): Promise<any> {
    parameters.message = parameters.message
      ? '<div dir="auto">' + parameters.message + '</div>'
      : parameters.message
    const alert = await this.alertCtrl.create(parameters)
    return await alert.present()
  }
}
