import { Injectable } from '@angular/core'
import { FirebaseRemoteConfig } from '@capacitor-firebase/remote-config'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Observable, from } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { getSeconds } from '../../../shared/utilities/time'
import { LogService } from '../misc/log.service'
import { Capacitor } from '@capacitor/core'
import { StorageService } from '../storage/storage.service'

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
    throw new Error('RemoteConfigService method not implemented')
  }

  forceFetch(): Promise<RemoteConfig> {
    throw new Error('RemoteConfigService method not implemented')
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

class FirebaseConfig implements RemoteConfig {
  readonly fetchedAt = new Date()
  cache: { [key: string]: string } = {}

  constructor(private logger: LogService) {}

  async get(key: ConfigKeys): Promise<string | null> {
    const cachedValue = this.cache[key.value]
    if (cachedValue !== undefined) {
      this.logger.log(`Retrieving ${key.value} from cache`)
      return Promise.resolve(cachedValue)
    }
    this.logger.log(`Retrieving ${key.value}`)
    const { value } = await FirebaseRemoteConfig.getString({
      key: key.value
    })
    return value
  }

  getOrDefault(key: ConfigKeys, defaultValue: string): Promise<string> {
    return this.get(key)
      .then((val: string) => (val.length == 0 ? defaultValue : val))
      .catch(e => {
        this.logger.error(
          `Failed to retrieve ${key.value}. Using default ${defaultValue}.`,
          e
        )
        return defaultValue
      })
  }
}

@Injectable()
export class FirebaseRemoteConfigService extends RemoteConfigService {
  private readonly configSubject: BehaviorSubject<RemoteConfig>
  private FETCH_TIMEOUT_SECONDS = 20
  private MINIMUM_FETCH_INTERVAL_SECONDS = 21600 // 6 hours

  constructor(
    storage: StorageService,
    private logger: LogService,
  ) {
    super(storage)
    this.configSubject = new BehaviorSubject(new EmptyRemoteConfig())
    if (Capacitor.isNativePlatform())
      FirebaseRemoteConfig.setMinimumFetchInterval({
        minimumFetchIntervalInSeconds: this.MINIMUM_FETCH_INTERVAL_SECONDS
      })
  }

  forceFetch(): Promise<RemoteConfig> {
    return this.fetch(0)
  }

  read(): Promise<RemoteConfig> {
    const currentValue = this.configSubject.value
    const nextFetch = currentValue.fetchedAt.getTime() + this.timeoutMillis
    if (new Date().getTime() <= nextFetch) {
      return Promise.resolve(currentValue)
    }

    return this.fetch(this.timeoutMillis)
  }

  private async fetch(timeoutMillis: number) {
    if (!Capacitor.isNativePlatform()) {
      return Promise.resolve(this.configSubject.value)
    }
    console.log('Fetching Firebase Remote Config')
    return await FirebaseRemoteConfig.fetchConfig({
      minimumFetchIntervalInSeconds: getSeconds({
        milliseconds: timeoutMillis
      })
    })
      .then(async () => await FirebaseRemoteConfig.activate())
      .then(activated => {
        console.log('New Firebase Remote Config did activate', activated)
        const conf = new FirebaseConfig(this.logger)
        this.configSubject.next(conf)
        return conf
      })
      .catch(e => this.configSubject.value)
  }

  subject(): Observable<RemoteConfig> {
    return from(this.read()).pipe(mergeMap(() => this.configSubject))
  }
}
