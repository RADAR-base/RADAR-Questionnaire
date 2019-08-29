import { Injectable } from '@angular/core'
import { Platform, ToastController } from 'ionic-angular'

@Injectable()
export class LogService {
  constructor(private plt: Platform, private toast: ToastController) {}

  presentToast(message: any) {
    // NOTE: Toast to show error log in the app UI
    const toast = this.toast.create({
      message: message.substring(0, 100) + '...',
      duration: 2000
    })
    toast.present()
  }

  log(...parameters: any[]) {
    if (this.plt.is('mobileweb')) {
      console.log(...parameters)
    } else {
      const formattedParameters = []
      parameters.forEach(p => {
        if (LogService.needsFormatting(p)) {
          formattedParameters.push(LogService.formatObject(p))
        }
        formattedParameters.push(p)
      })
      console.log(...formattedParameters)
    }
  }

  error(message: string, error: any, presentToast?: boolean): Error {
    const formattedError = LogService.formatObject(error)
    const formattedException = `${message}: ${formattedError}`
    console.log(formattedException, error)

    if (presentToast) this.presentToast(formattedError)

    if (error instanceof Error) {
      return error
    } else {
      return new Error(formattedException)
    }
  }

  static needsFormatting(obj: any): boolean {
    if (Array.isArray(obj)) {
      return (<any[]>obj).some(o => this.needsFormatting(o))
    } else {
      return typeof obj === 'object'
    }
  }

  static formatObject(obj: any): string {
    if (Array.isArray(obj)) {
      return (<any[]>obj).map(o => this.formatObject(o)).toString()
    } else if (typeof obj !== 'object') {
      return String(obj)
    } else if (obj.toString !== Object.prototype.toString) {
      return obj.toString()
    } else if (typeof obj['json'] === 'function') {
      return obj.json()
    } else if (obj.hasOwnProperty('message')) {
      return obj.message
    } else {
      const res = JSON.stringify(obj)
      return res == '{}' ? '<empty object>' : res
    }
  }
}
