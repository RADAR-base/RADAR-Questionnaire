export interface ObservationKey {
  projectId?: string
  userId: string
  sourceId: string
}

export interface SchemaMetadata {
  id: number
  version: number
  schema: string
}

export enum SchemaType {
  ASSESSMENT = 'assessment',
  COMPLETION_LOG = 'completion_log',
  TIMEZONE = 'timezone',
  USAGE = 'usage'
}
