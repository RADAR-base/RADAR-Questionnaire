import { Injectable } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'

import { User } from '../../shared/models/user'

@Injectable()
export class FirebaseAnalyticsService {
  constructor(private firebase: Firebase) {}

  logEvent(event: string, params): Promise<any> {
    return this.firebase
      .logEvent(event, params)
      .then((res: any) => {
        console.log('firebase analytics service: ' + res)
        return Promise.resolve(res)
      })
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
    return Promise.resolve(
      Object.entries(userProperties)
        .filter(([k, v]) => k)
        .forEach(([key, value]) => this.firebase.setUserProperty(key, value))
    )
  }

  setUserId(userId: string): Promise<any> {
    return this.firebase.setUserId(userId)
  }

  setCurrentScreen(screenName: string): Promise<any> {
    return this.firebase.setScreenName(screenName)
  }
}
