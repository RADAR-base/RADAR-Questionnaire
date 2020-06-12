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
