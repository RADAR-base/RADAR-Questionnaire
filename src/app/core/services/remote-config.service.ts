import { Injectable, InjectionToken } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'

import { BehaviorSubject, Observable } from 'rxjs'
import { ConfigKeys } from '../../shared/enums/config'

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
  constructor(private firebase: Firebase) {}

  get(key: ConfigKeys): Promise<string | null> {
    return this.firebase.getValue(key.value);
  }

  getOrDefault(key: ConfigKeys, defaultValue: string): Promise<string> {
    return this.firebase.getValue(key.value)
      .catch(() => defaultValue)
  }
}

@Injectable()
export class FirebaseRemoteConfigService implements RemoteConfigService {
  private timeoutMillis = 14_400_000;  // 3 hours
  private lastFetch: number = 0;
  private configSubject: BehaviorSubject<RemoteConfig> = new BehaviorSubject(new FirebaseRemoteConfig(this.firebase))

  constructor(private firebase: Firebase) {}

  setCacheExpiration(timeoutMillis: number) {
    this.timeoutMillis = timeoutMillis;
  }

  forceFetch(): Promise<RemoteConfig> {
    return this.fetch(0);
  }

  read(): Promise<RemoteConfig> {
    const now = new Date().getTime()
    if (this.lastFetch + this.timeoutMillis >= now) {
      return Promise.resolve(this.configSubject.value);
    }

    return this.fetch(this.timeoutMillis)
      .then(conf => {
        this.lastFetch = now
        return conf;
      })
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
        const conf = new FirebaseRemoteConfig(this.firebase)
        if (activated) {
          this.configSubject.next(conf)
        }
        return conf
      })
  }

  subject(): Observable<RemoteConfig> {
    return this.configSubject;
  }
}
