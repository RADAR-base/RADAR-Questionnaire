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
  GENERAL_HEALTH = 'healthkit_generic_data',

  // aggregated data
  // !Will have to remove activity here, since each activity acutally contains more payload 
  // Steps, Calroies, Nutrition    [ 'steps', 'distance','calories','activity', 'nutrition'] 
  AGGREGATED_HEALTH = 'healthkit_aggregated_exercise_data'
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
