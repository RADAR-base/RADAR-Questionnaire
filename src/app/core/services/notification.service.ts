import { Injectable } from '@angular/core'

@Injectable()
export class NotificationService {
  cancel(): Promise<void> {
    return undefined
  }
  permissionCheck(): Promise<void> {
    return undefined
  }
  publish(limit?: number): Promise<void[]> {
    return undefined
  }
}
