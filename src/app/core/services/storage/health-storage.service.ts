import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { Observable, Subject, throwError as observableThrowError } from 'rxjs'
import { filter, startWith, switchMap } from 'rxjs/operators'

import { StorageKeys } from '../../../shared/enums/storage'
import { LogService } from '../misc/log.service'
import { StorageService } from './storage.service'

@Injectable()
export class HealthStorageService extends StorageService {
  global: { [key: string]: any } = {}

  constructor(
    public logger: LogService,
    public healthStorage: Storage,
    public platform: Platform
  ) {
    super(healthStorage, logger, platform)
    this.platform.ready().then(() => {
      this.healthStorage = new Storage({
        name: '__health_db',
        storeName: '_data',
        driverOrder: ['sqlite', 'indexeddb', 'websql', 'localstorage']
      })

      this.prepare().then(() =>
        this.logger.log('Global configuration', this.global)
      )
    })
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: StorageKeys, value: any): Promise<any> {
    const keys = Object.keys(value)
    return Promise.all(
      keys.map(k => {
        this.global[k] = value[k]
        return this.healthStorage.set(k, value[k])
      })
    )
  }

  get(key: StorageKeys): Promise<any> {
    const k = key.toString()
    if (this.global !== undefined) {
      return Promise.resolve(this.global)
    }
  }

  observe(key: StorageKeys): Observable<any> {
    return this.keyUpdates.pipe(
      startWith(key),
      filter(k => k === key || k === null),
      switchMap(k => this.get(k))
    )
  }

  remove(keys: any) {
    return Promise.all(
      keys.map(k =>
        this.healthStorage
          .remove(k)
          .then(() => delete this.global[k])
          .catch(error => this.handleError(error))
      )
    )
  }

  getAllKeys(): Promise<string[]> {
    return this.storage.keys()
  }

  prepare() {
    return this.healthStorage
      .keys()
      .then(keys =>
        Promise.all(
          keys.map(k =>
            this.healthStorage.get(k).then(v => (this.global[k] = v))
          )
        )
      )
      .then(() => 'Health Store set')
  }

  clear() {
    this.global = {}
    return this.storage.clear().then(() => this.keyUpdates.next(null))
  }
}
