import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { Observable, Subject, throwError as observableThrowError } from 'rxjs'
import { filter, startWith, switchMap } from 'rxjs/operators'

import { StorageKeys } from '../../../shared/enums/storage'
import { LogService } from '../misc/log.service'

@Injectable()
export class StorageService {
  global: { [key: string]: any } = {}
  healthGlobal: { [key: string]: any } = {}

  private readonly keyUpdates: Subject<StorageKeys | null>

  constructor(
    private storage: Storage,
    private logger: LogService,
    private healthStorage: Storage,
    private platform: Platform
  ) {
    this.platform.ready().then(() => {
      this.healthStorage = new Storage({
        name: '__health_db',
        storeName: '_data',
        driverOrder: ['sqlite', 'indexeddb', 'websql', 'localstorage']
      })

      this.prepare()
        .then(() => this.logger.log('Global configuration', this.global))
        .then(() =>
          this.prepareHealth().then(() =>
            this.logger.log('Global configuration', this.healthGlobal)
          )
        )
    })

    this.keyUpdates = new Subject<StorageKeys | null>()
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: StorageKeys, value: any): Promise<any> {
    const k = key.toString()
    this.global[k] = value
    return this.storage.set(k, value).then(res => {
      this.keyUpdates.next(key)
      return res
    })
  }

  resetHealthData(): Promise<any> {
    this.healthGlobal = {}
    return this.healthStorage.clear()
  }

  setHealthData(value: any): Promise<any> {
    const keys = Object.keys(value)
    return Promise.all(
      keys.map(k => {
        this.healthGlobal[k] = value[k]
        return this.healthStorage.set(k, value[k])
      })
    )
  }

  removeHealthData(keys: any[]) {
    return Promise.all(
      keys.map(k =>
        this.healthStorage
          .remove(k)
          .then(() => delete this.healthGlobal[k])
          .catch(error => this.handleError(error))
      )
    )
  }

  push(key: StorageKeys, value: any): Promise<any> {
    if (this.global[key.toString()]) this.global[key.toString()].push(value)
    else this.global[key.toString()] = [value]
    return this.storage
      .set(key.toString(), this.global[key.toString()])
      .then(res => {
        this.keyUpdates.next(key)
        return res
      })
  }

  get(key: StorageKeys): Promise<any> {
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

  getHealthData(key: StorageKeys): Promise<any> {
    const k = key.toString()
    if (this.healthGlobal !== undefined) {
      return Promise.resolve(this.healthGlobal)
    }
  }

  observe(key: StorageKeys): Observable<any> {
    return this.keyUpdates.pipe(
      startWith(key),
      filter(k => k === key || k === null),
      switchMap(k => this.get(k))
    )
  }

  remove(key: StorageKeys) {
    const k = key.toString()
    return this.storage
      .remove(k)
      .then(res => {
        this.global[k] = null
        this.keyUpdates.next(key)
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

  prepareHealth() {
    return this.healthStorage
      .keys()
      .then(keys =>
        Promise.all(
          keys.map(k =>
            this.healthStorage.get(k).then(v => (this.healthGlobal[k] = v))
          )
        )
      )
      .then(() => 'Health Store set')
  }

  clear() {
    this.global = {}
    return this.storage.clear().then(() => this.keyUpdates.next(null))
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
