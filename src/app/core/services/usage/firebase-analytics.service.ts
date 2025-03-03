import { Injectable } from '@angular/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { Platform } from '@ionic/angular'

import { User } from '../../../shared/models/user'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { AnalyticsService } from './analytics.service'
import { Capacitor } from '@capacitor/core'

@Injectable({
  providedIn: 'root'
})
export class FirebaseAnalyticsService extends AnalyticsService {
  constructor(
    private platform: Platform,
    private logger: LogService,
    private remoteConfig: RemoteConfigService
  ) {
    super()
  }

  logEvent(event: string, params: { [key: string]: string }): Promise<any> {
    // this.logger.log('Firebase Event', event)
    if (!Capacitor.isNativePlatform()) return Promise.resolve()

    const cleanParams = {}

    Object.entries(params).forEach(([key, value]) => {
      const cleanKey = this.crop(
        key,
        40,
        `Firebase analytics key ${key} is too long, cropping to 40 characters`
      )
      cleanParams[cleanKey] = this.crop(
        String(value),
        100,
        `Firebase analytics value for ${key} is too long, cropping to 100 characters: ${value}`
      )
    })

    return FirebaseAnalytics.logEvent({ name: event, params: cleanParams })
      .then((res: any) => {
        // this.logger.log('firebase analytics service', res)
        return res
      })
      .catch((error: any) => {
        this.logger.error('firebase analytics service', error)
        throw error
      })
  }

  /**
   * @beta
   * @description
   * Add User Property for Firebase Analytics
   *
   *
   * 1. Register the property in the Analytics page of the Firebase console.
   *
   * 2. Add code to set an Analytics User Property with the setUserPropertys() method as below.
   *
   *
   * @usage
   * ```typescript
   *
   *
   * ...
   *
   * this.firebaseAnalyticsService.setUserProperties(
   *    {
   *      subjectId: xxx,
   *      projectId: yyy,
   *      ....
   * }
   * )
   *
   * ```
   */

  setUserProperties(
    userProperties: User | Object,
    keyPrefix?: string
  ): Promise<any> {
    if (!this.platform.is('cordova'))
      return Promise.resolve('Could not load firebase')

    return Promise.all(
      Object.entries(userProperties)
        .filter(([k, v]) => k)
        .map(([key, value]) => {
          return FirebaseAnalytics.setUserProperty({
            key: this.crop(
              this.formatUserPropertyKey(key, keyPrefix),
              24,
              `Firebase User Property name ${key} is too long, cropping`
            ),
            value: this.crop(
              LogService.formatObject(value),
              36,
              `Firebase User Property value ${value} for ${key} is too long, cropping`
            )
          })
        })
    ).then(() => this.remoteConfig.forceFetch())
  }

  formatUserPropertyKey(key: string, keyPrefix: string) {
    return (keyPrefix ? keyPrefix + key : key).replace(/[\W]+/g, '_')
  }

  setUserId(userId: string): Promise<any> {
    if (!Capacitor.isNativePlatform()) return Promise.resolve()
      return FirebaseAnalytics.setUserId({ userId: userId })
  }

  setCurrentScreen(screenName: string): Promise<any> {
    if (!Capacitor.isNativePlatform()) return Promise.resolve()
    return FirebaseAnalytics.setCurrentScreen({ screenName })
  }

  crop(value: string, size: number, message?: string): string {
    if (!value) return ''

    if (value.length <= size) {
      return value
    } else {
      if (message) {
        this.logger.log(message)
      }
      return value.substring(0, size)
    }
  }

  enableAnalytics() {
    if (!this.platform.is('cordova'))
      return Promise.resolve('Could not load firebase')

    return FirebaseAnalytics.setEnabled({ enabled: true })
  }
}
