import 'rxjs/add/operator/mergeMap'

import { Injectable } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Platform } from 'ionic-angular'
import { BehaviorSubject, Observable, from, merge } from 'rxjs'

import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { getSeconds } from '../../../shared/utilities/time'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { concatMap, first, mergeMap, skip } from "rxjs/operators";

declare var FirebasePlugin

@Injectable()
export class RemoteConfigService {
  protected timeoutMillis: number = 10_800_000

  constructor(private storage: StorageService) {
    this.storage.get(StorageKeys.REMOTE_CONFIG_CACHE_TIMEOUT).then(timeout => {
      if (timeout) {
        this.timeoutMillis = timeout
      } else {
        this.timeoutMillis = 10_800_000 // 3 hours
        return this.storage.set(
          StorageKeys.REMOTE_CONFIG_CACHE_TIMEOUT,
          this.timeoutMillis
        )
      }
    })
  }

  setCacheExpiration(timeoutMillis: number): Promise<number> {
    return this.storage
      .set(StorageKeys.REMOTE_CONFIG_CACHE_TIMEOUT, timeoutMillis)
      .then(timeout => {
        if (timeout) {
          this.timeoutMillis = timeout
        }
        return timeoutMillis
      })
  }

  read(): Promise<RemoteConfig> {
    return this.subject().pipe(
      first()
    ).toPromise().then(currentValue => {
      const nextFetch = currentValue.fetchedAt.getTime() + this.timeoutMillis
      if (new Date().getTime() <= nextFetch) {
        return Promise.resolve(currentValue)
      } else {
        return this.fetch(this.timeoutMillis);
      }
    });
  }

  fetch(timeoutMillis: number): Promise<RemoteConfig> {
    throw new Error('RemoteConfigService method not implemented')
  }

  forceFetch(): Promise<RemoteConfig> {
    return this.fetch(0);
  }

  subject(): Observable<RemoteConfig> {
    throw new Error('RemoteConfigService method not implemented')
  }
}

export interface RemoteConfig {
  readonly fetchedAt: Date

  get(key: ConfigKeys): Promise<string | null>
  getOrDefault(key: ConfigKeys, defaultValue: string): Promise<string>
}

class EmptyRemoteConfig implements RemoteConfig {
  readonly fetchedAt = new Date(0)

  get(key: ConfigKeys): Promise<any> {
    return Promise.resolve()
  }
  getOrDefault(key: ConfigKeys, defaultValue: any): Promise<string> {
    return Promise.resolve(defaultValue)
  }
}

class FirebaseRemoteConfig implements RemoteConfig {
  readonly fetchedAt = new Date()

  constructor(private firebase: FirebaseX, private logger: LogService) {}

  get(key: ConfigKeys): Promise<string | null> {
    this.logger.log(`Retrieving ${key.value}`)
    return this.firebase.getValue(key.value)
  }

  getOrDefault(key: ConfigKeys, defaultValue: string): Promise<string> {
    return this.get(key)
      .then((val: string) => (val && val.length ? val : defaultValue))
      .catch(e => {
        this.logger.error(`Failed to retrieve ${key.value}. Using default ${defaultValue}.`, e)
        return defaultValue
      })
  }
}

@Injectable()
export class FirebaseRemoteConfigService extends RemoteConfigService {
  private readonly configSubject: BehaviorSubject<RemoteConfig>
  private FETCH_TIMEOUT_SECONDS = 20

  constructor(
    private firebase: FirebaseX,
    storage: StorageService,
    private logger: LogService,
    private platform: Platform
  ) {
    super(storage)
    this.configSubject = new BehaviorSubject(new EmptyRemoteConfig())
    this.platform.ready().then(() => {
      FirebasePlugin.setConfigSettings(this.FETCH_TIMEOUT_SECONDS, null)
    });
  }

  fetch(timeoutMillis: number) {
    if (!this.platform.is('cordova')) {
      console.log('Not fetching Firebase Remote Config without cordova')
      return Promise.resolve(this.configSubject.value)
    }
    console.log('Fetching Firebase Remote Config')
    return this.firebase
      .fetch(getSeconds({ milliseconds: timeoutMillis }))
      .then(() => this.firebase.activateFetched())
      .then(activated => {
        console.log('New Firebase Remote Config did activate', activated)
        const conf = new FirebaseRemoteConfig(this.firebase, this.logger)
        this.configSubject.next(conf)
        return conf
      })
      .catch(e => this.configSubject.value)
  }

  subject(): Observable<RemoteConfig> {
    if (this.configSubject.value.fetchedAt.getTime() === 0) {
      return from(this.fetch(this.timeoutMillis)).pipe(
        concatMap(() => this.configSubject.pipe(skip(1))),
      )
    } else {
      return this.configSubject;
    }
  }
}
