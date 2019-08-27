export interface SchemaMetadata {
  id: number
  version: number
  schema: string
}

export enum SchemaType {
  ASSESSMENT = 'assessment',
  COMPLETION_LOG = 'completion_log',
  TIMEZONE = 'timezone',
  EVENT = 'event',
  SCHEDULE = 'schedule'
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
