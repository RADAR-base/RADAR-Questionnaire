import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage-angular'
import { Observable, Subject, throwError as observableThrowError } from 'rxjs'
import { filter, startWith, switchMap } from 'rxjs/operators'

import { StorageKeys } from '../../../shared/enums/storage'
import { LogService } from '../misc/log.service'

@Injectable()
export class StorageService {
  global: { [key: string]: any } = {}
  healthGlobal: { [key: string]: any } = {}

  public readonly keyUpdates: Subject<StorageKeys | null>

  constructor(
    public storage: Storage,
    public logger: LogService,
    public platform: Platform
  ) {
    this.keyUpdates = new Subject<StorageKeys | null>()
  }

  init() {
    return this.platform.ready().then(() => {
      return this.getStorageState().then(() =>
        this.logger.log('Global configuration', this.global)
      )
    })
  }

  getStorageState(): Promise<any> {
    return this.storage.create().then(() => {
      return this.prepare()
    })
  }

  set(key: StorageKeys, value: any): Promise<any> {
    const k = key.toString()
    this.global[k] = value
    return this.storage.set(k, value).then(res => {
      this.keyUpdates.next(key)
      return res
    })
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

  clear() {
    this.global = {}
    return this.storage.clear().then(() => this.keyUpdates.next(null))
  }

  handleError(error: any) {
    const errMsg = error.message
      ? error.message
      : error.status
        ? `${error.status} - ${error.statusText}`
        : 'error'
    return observableThrowError(errMsg)
  }
}
