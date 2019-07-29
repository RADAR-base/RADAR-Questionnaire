import { Injectable, InjectionToken } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'

import { BehaviorSubject, Observable, from } from 'rxjs'
import { ConfigKeys } from '../../shared/enums/config'
import 'rxjs/add/operator/mergeMap'
import { LogService } from './log.service'

export const REMOTE_CONFIG_SERVICE = new InjectionToken<RemoteConfig>('RemoteConfig');

export interface RemoteConfigService {
  setCacheExpiration(timeoutMillis: number)
  read(): Promise<RemoteConfig>
  forceFetch(): Promise<RemoteConfig>
  subject(): Observable<RemoteConfig>
}

export interface RemoteConfig {
  get(key: ConfigKeys): Promise<any>
  getOrDefault(key: ConfigKeys, defaultValue: any): Promise<any>
}

class FirebaseRemoteConfig implements RemoteConfig {
  constructor(
    private firebase: Firebase,
    private logger: LogService,
  ) {}

  get(key: ConfigKeys): Promise<string | null> {
    return this.firebase.getValue(key.value, '')
  }

  getOrDefault(key: ConfigKeys, defaultValue: string): Promise<string> {
    console.log(`Retrieving ${key.value}`)
    return this.firebase.getValue(key.value, '')
      .then((val: string) => val.length == 0 ? defaultValue : val)
      .catch(e => {
        this.logger.error(`Failed to retrieve ${key.value} (using default ${defaultValue})`, e)
        return defaultValue
      })
  }
}

@Injectable()
export class FirebaseRemoteConfigService implements RemoteConfigService {
  private timeoutMillis = 14_400_000;  // 3 hours
  private lastFetch: number = 0;
  private readonly configSubject: BehaviorSubject<RemoteConfig>

  constructor(
    private firebase: Firebase,
    private logger: LogService,
  ) {
    this.configSubject = new BehaviorSubject(new FirebaseRemoteConfig(this.firebase, this.logger))
  }

  setCacheExpiration(timeoutMillis: number) {
    this.timeoutMillis = timeoutMillis;
  }

  forceFetch(): Promise<RemoteConfig> {
    return this.fetch(0);
  }

  read(): Promise<RemoteConfig> {
    if (this.lastFetch + this.timeoutMillis >= new Date().getTime()) {
      return Promise.resolve(this.configSubject.value);
    }

    return this.fetch(this.timeoutMillis)
  }

  private fetch(timeoutMillis: number) {
    console.log("Fetching Firebase Remote Config")
    return this.firebase.fetch(timeoutMillis)
      .then(() => {
        console.log("Activating Firebase Remote Config")
        return this.firebase.activateFetched()
      })
      .then((activated) => {
        console.log("New Firebase Remote Config did activate", activated)
        const conf = new FirebaseRemoteConfig(this.firebase, this.logger)
        if (activated) {
          this.configSubject.next(conf)
        }
        this.lastFetch = new Date().getTime()
        return conf
      })
  }

  subject(): Observable<RemoteConfig> {
    if (this.lastFetch == 0) {
      return from(this.read())
        .mergeMap(() => this.configSubject)
    } else {
      return this.configSubject
    }
  }
}
