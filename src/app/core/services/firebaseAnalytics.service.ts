import { Injectable } from '@angular/core'

import { User } from '../../shared/models/user'
import { Utility } from '../../shared/utilities/util'

declare var FirebasePlugin
@Injectable()
export class FirebaseAnalyticsService {
  constructor(private utility: Utility) {}

  logEvent(event: string, params): Promise<any> {
    console.log('Event', event)
    if (this.utility.isPlatformBrowser)
      return Promise.resolve('Could not load firebase')
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
