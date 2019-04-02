import { Injectable } from '@angular/core'
import { FirebaseAnalytics } from '@ionic-native/firebase-analytics/ngx'

import { User } from '../../shared/models/user'

@Injectable()
export class FirebaseAnalyticsService {
  constructor(private firebaseAnalytics: FirebaseAnalytics) {}

  logEvent(event: string, params): Promise<any> {
    console.log('Event', event)
    if(this.firebaseAnalytics) {
      return this.firebaseAnalytics
        .logEvent(event, params)
        .then((res: any) => {
          console.log('firebase analytics service: ' + res)
          return Promise.resolve(res)
        })
        .catch((error: any) => {
          console.log('firebase analytics service: ' + error)
          return Promise.reject(error)
        })
    } else {
      Promise.resolve("Could not load firebase")
    }

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

  setUserProperties(userProperties: User): Promise<any> {
    return Promise.resolve(
      Object.entries(userProperties)
        .filter(([k, v]) => k)
        .forEach(([key, value]) =>
          this.firebaseAnalytics.setUserProperty(key, value)
        )
    )
  }

  setUserId(userId: string): Promise<any> {
    return this.firebaseAnalytics.setUserId(userId)
  }

  setCurrentScreen(screenName: string): Promise<any> {
    return this.firebaseAnalytics.setCurrentScreen(screenName)
  }
}
