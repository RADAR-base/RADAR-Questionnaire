import { Device } from '@ionic-native/device/ngx'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Injectable } from '@angular/core'
import { User } from '../../../shared/models/user'
import { LogService } from '../misc/log.service'

@Injectable()
export class FirebaseAnalyticsService {
  constructor(
    private firebase: Firebase,
    private device: Device,
    private logger: LogService,
  ) {}

  logEvent(event: string, params): Promise<any> {
    this.logger.log('Firebase Event', event)
    if (!this.device.platform) {
      return Promise.resolve('Could not load firebase')
    }
    return this.firebase
      .logEvent(event.toLowerCase(), params)
      .then((res: any) => {
        this.logger.log('firebase analytics service', res)
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
