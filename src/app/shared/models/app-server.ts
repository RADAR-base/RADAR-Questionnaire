export interface FcmNotificationDto {
  appPackage: string
  body: string
  delivered?: boolean
  id?: number
  scheduledTime: number
  sourceId: string
  sourceType?: string
  title: string
  ttlSeconds: number
  type: string
  fcmMessageId?: number
}

export interface FcmNotificationError {
  dto?: FcmNotificationDto
  errorMessage: string
  message: string
}

export interface FcmNotifications {
  notifications?: Array<FcmNotificationDto>
}

export interface FcmUserDto {
  enrolmentDate: Date
  fcmToken: string
  id?: number
  lastDelivered?: Date
  lastOpened?: Date
  projectId: string
  subjectId: string
  timezone: number
  language: string
}

export interface FcmUsers {
  users?: Array<FcmUserDto>
}

export interface RadarProjectDto {
  id?: number
  projectId: string
}

export interface RadarProjects {
  projects?: Array<RadarProjectDto>
}
