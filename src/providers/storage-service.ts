import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'
import { Observable } from 'rxjs/Observable'

@Injectable()
export class StorageService {

  constructor(
    private storage: Storage
  ) {

  }

  getStorageState() {
    return this.storage.ready()
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  set(key: string, value: any): Promise<any> {
    return this.storage.set(key, value)
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  get(key: string) {
    return this.storage.get(key)
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  remove(key: string) {
    return this.storage.remove(key)
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  getAllKeys() {
    return this.storage.keys()
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  clearStorage() {
    return this.storage.clear()
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'error'
    return Observable.throw(errMsg)
  }

}
