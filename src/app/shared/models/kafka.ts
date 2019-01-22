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
