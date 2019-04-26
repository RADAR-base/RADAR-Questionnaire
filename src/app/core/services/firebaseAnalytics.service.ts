import { Injectable } from '@angular/core'

import { User } from '../../shared/models/user'

declare var FirebasePlugin
@Injectable()
export class FirebaseAnalyticsService {
  constructor() {}

  logEvent(event: string, params): Promise<any> {
    return FirebasePlugin.logEvent(
      event,
      params,
      (res: any) => {
        console.log('firebase analytics service: ' + res)
        return Promise.resolve(res)
      },
      (error: any) => {
        console.log('firebase analytics service: ' + error)
        return Promise.reject(error)
      }
    )
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
        .forEach(([key, value]) => FirebasePlugin.setUserProperty(key, value))
    )
  }

  setUserId(userId: string): Promise<any> {
    return FirebasePlugin.setUserId(userId)
  }

  setCurrentScreen(screenName: string): Promise<any> {
    return FirebasePlugin.setScreenName(screenName)
  }
}
