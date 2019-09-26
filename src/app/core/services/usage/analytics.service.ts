import { Injectable } from '@angular/core'
import { User } from '../../../shared/models/user'

@Injectable()
export class AnalyticsService {
  logEvent(event: string, params?: any): Promise<void> {
    return undefined
  }
  setUserProperties(properties: User): Promise<void> {
    return undefined
  }
  setUserId(id: string): Promise<void> {
    return undefined
  }
  setCurrentScreen(name: string): Promise<void> {
    return undefined
  }
}
