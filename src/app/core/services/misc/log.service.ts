import { Injectable } from '@angular/core'
import { Platform } from 'ionic-angular'

@Injectable()
export class LogService {
  constructor(private plt: Platform) {}

  log(message: any, ...optionalParameters: any[]) {
    if (this.plt.is('desktop')) {
      console.log(message, ...optionalParameters)
    } else {
      console.log(
        LogService.formatObject(message),
        ...optionalParameters.map(o => LogService.formatObject(o))
      )
    }
  }

  error(message: string, error: any): Error {
    const formattedException = `${message}: ${LogService.formatObject(error)}`
    if (this.plt.is('desktop')) {
      console.log(formattedException, error)
    } else {
      console.log(formattedException)
    }

    if (error instanceof Error) {
      return error
    } else {
      return new Error(formattedException)
    }
  }

  static formatObject(obj: any): string {
    if (Array.isArray(obj)) {
      return (<Array<any>>obj).map(o => this.formatObject(o)).toString()
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
