import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'
import { Observable } from 'rxjs/Observable'
import { NotificationSettings } from '../models/settings'

@Injectable()
export class StorageService {

  constructor(
    private storage: Storage
  ) {

  }

  init(patientId:String) {
    let allKeys = this.getAllKeys()
    allKeys.then((keys) => {
      if(keys.length==0){
        let defaultNotificationSettings: NotificationSettings = {
          sound: true,
          vibration: false,
          nightMode: true
        }
        let today = new Date()
        this.set('referenceDate', today.getTime())
        this.set('patientId', patientId)
        this.set('language', 'English')
        this.set('settings-notifications', defaultNotificationSettings)
        this.set('settings-languages', ['English','Italian','Spanish','Dutch','German'])
      }
    }).catch((error) => {
      this.handleError(error)
    })
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: string, value: any): Promise<any> {
    return this.storage.set(key, value)
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  get(key: string) {
    return this.storage.get(key)
  }

  remove(key: string) {
    return this.storage.remove(key)
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  getAllKeys() {
    return this.storage.keys()
  }

  clearStorage() {
    return this.storage.clear()
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'error'
    return Observable.throw(errMsg)
  }

}
