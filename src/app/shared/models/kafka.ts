export interface SchemaMetadata {
  id: number
  version: number
  schema: string
}

export enum SchemaType {
  ASSESSMENT = 'assessment',
  COMPLETION_LOG = 'completion_log',
  TIMEZONE = 'timezone',
  APP_EVENT = 'app_event',
  OTHER = 'other',

  // generic 
  GENERAL_HEALTH = 'general_health',

  // aggregated data
  //   Steps, Calroies, Nutrition    [ 'steps', 'distance','calories','activity', 'nutrition'] 
  AGGREGATED_HEALTH = 'aggregated_health'
}

export interface KeyExport {
  userId: string
  sourceId: string
  projectId: string
}

export interface KafkaObject {
  key: KeyExport
  value: any
}
