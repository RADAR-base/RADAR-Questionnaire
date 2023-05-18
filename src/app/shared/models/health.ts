export enum HealthkitFloatDataType {
  STAIRS = 'stairs',
  DISTANCE = 'distance',
  APPLE_EXERCISE_TIME = 'appleExerciseTime',
  VO2MAX = 'vo2Max',
  ACTIVITY = 'activity'
}

export enum HealthkitStringDataType {
  SLEEP = 'sleep',
  ACTIVITY = 'activity',
  GENDER = 'gender',
  DATE_OF_BIRTH = 'date_of_birth'
}

export enum HealthkitSchemaType {
  ACTIVITY = 'healthkit_activity',
  BODY_MEASUREMENT = 'healthkit_body_measurement',
  CALORIES = 'healthkit_calories',
  HEART_RATE = 'healthkit_heart_rate',
  VITAL_SIGNS = 'healthkit_vital_signs'
}

export interface HealthkitValueExport {
  startTime: number
  endTime: number
  timeReceived: number
  sourceId: string
  sourceName: string
  unit: string
  key: string
  intValue: number
  floatValue: number
  doubleValue: number
  stringValue: string
}

