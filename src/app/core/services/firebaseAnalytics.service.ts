import { Injectable } from '@angular/core'
import { FirebaseAnalytics } from '@ionic-native/firebase-analytics/ngx';
import { User } from '../../shared/models/user'

declare var cordova

@Injectable()
export class FirebaseAnalyticsService {

  constructor(private firebaseAnalytics: FirebaseAnalytics) { }

  logEvent(event: string, params): Promise<any> {
    return cordova.plugins.firebase.analytics.logEvent(event, params)
    .then((res: any) => {
      console.log('firebase analytics service: ' + res)
      return Promise.resolve(res) }
    )
    .catch((error: any) => {
      console.log('firebase analytics service: ' + error)
      return Promise.reject(error)
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

  setUserProperties(userProperties: User): Promise<any> {
    return Promise.resolve(Object.entries(userProperties).filter(([k,v]) => k)
    .forEach(([key, value]) =>
          cordova.plugins.firebase.analytics.setUserProperty(key, value)))
  }

  setUserId(userId: string): Promise<any> {
    return cordova.plugins.firebase.analytics.setUserId(userId)
  }

  setCurrentScreen(screenName: string): Promise<any> {
    return cordova.plugins.firebase.analytics.setCurrentScreen(screenName)
  }

}
