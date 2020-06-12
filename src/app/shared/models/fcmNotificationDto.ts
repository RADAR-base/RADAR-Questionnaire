export interface FcmNotificationDto {
  appPackage: string
  body: string
  delivered?: boolean
  id?: number
  scheduledTime: Date
  sourceId: string
  sourceType?: string
  title: string
  ttlSeconds: number
  type: string
}
