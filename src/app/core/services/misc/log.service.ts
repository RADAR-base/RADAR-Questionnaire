import { Injectable } from '@angular/core'
import { Platform } from 'ionic-angular'

@Injectable()
export class LogService {
  constructor(private plt: Platform) {}

  log(...parameters: any[]) {
    if (this.plt.is('mobileweb')) {
      console.log(...parameters)
    } else {
      const message = parameters.map(p => LogService.formatObject(p)).join(', ')
      console.log(message, ...parameters)
    }
  }

  error(message: string, error: any): Error {
    const formattedException = `${message}: ${LogService.formatObject(error)}`
    console.log(formattedException, error)

    if (error && (error instanceof Error)) {
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
