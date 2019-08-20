import { Injectable } from '@angular/core'

@Injectable()
export class AnalyticsService {
  logEvent(event, params?): Promise<void> {
    return undefined
  }
  setUserProperties(properties): Promise<void> {
    return undefined
  }
  setUserId(id): Promise<void> {
    return undefined
  }
  setCurrentScreen(name): Promise<void> {
    return undefined
  }
}
