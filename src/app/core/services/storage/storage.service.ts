import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { throwError as observableThrowError } from 'rxjs'

import { StorageKeys } from '../../../shared/enums/storage'
import { LogService } from '../misc/log.service'

@Injectable()
export class StorageService {
  global: { [key: string]: any } = {}

  constructor(private storage: Storage, private logger: LogService) {
    this.prepare().then(() =>
      this.logger.log('Global configuration', this.global)
    )
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: StorageKeys, value: any): Promise<any> {
    const k = key.toString()
    this.global[k] = value
    return this.storage.set(k, value)
  }

  push(key: StorageKeys, value: any): Promise<any> {
    if (this.global[key.toString()]) this.global[key.toString()].push(value)
    else this.global[key.toString()] = [value]
    return this.storage.set(key.toString(), this.global[key.toString()])
  }

  get(key: StorageKeys) {
    const k = key.toString()
    const local = this.global[k]
    if (local !== undefined) {
      return Promise.resolve(local)
    } else {
      return this.storage.get(k).then(value => {
        this.global[k] = value
        return value
      })
    }
  }

  remove(key: StorageKeys) {
    const k = key.toString()
    return this.storage
      .remove(k)
      .then(res => {
        this.global[k] = null
        return res
      })
      .catch(error => this.handleError(error))
  }

  getAllKeys(): Promise<string[]> {
    return this.storage.keys()
  }

  prepare() {
    return this.getAllKeys()
      .then(keys =>
        Promise.all(
          keys.map(k => this.storage.get(k).then(v => (this.global[k] = v)))
        )
      )
      .then(() => 'Store set')
  }

  clear() {
    this.global = {}
    return this.storage.clear()
  }

  private handleError(error: any) {
    const errMsg = error.message
      ? error.message
      : error.status
      ? `${error.status} - ${error.statusText}`
      : 'error'
    return observableThrowError(errMsg)
  }
}
