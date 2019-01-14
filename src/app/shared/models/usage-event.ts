export interface UsageEventValueExport {
  time: number
  timeReceived: number
  packageName: string
  categoryName?: string
  categoryNameFetchTime?: number
  eventType: UsageEventType
}

export enum UsageEventType {
  APP_OPEN_NOTIFICATION = 'APP_OPEN_NOTIFICATION',
  APP_OPEN_DIRECTLY = 'APP_OPEN_DIRECTLY',
  QUESTIONNAIRE_STARTED = 'QUESTIONNAIRE_STARTED',
  QUESTIONNAIRE_COMPLETED = 'QUESTIONNAIRE_COMPLETED'
}
