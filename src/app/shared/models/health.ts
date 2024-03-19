export enum HealthkitPermission {
  STAIRS = 'stairs',
  DISTANCE = 'distance',
  DURATION = 'duration',
  ACTIVITY = 'activity',
  CALORIES = 'calories',
  BLOOD_GLUCOSE = 'bloodGlucose',
  WEIGHT = 'weight',
  HEART_RATE = 'heartRate'
}

export enum HealthkitDataType {
  STEP_COUNT = 'stepCount',
  FLIGHTS_CLIMBED = 'flightsClimbed',
  DISTANCE_WALKING_RUNNING = 'distanceWalkingRunning',
  DISTANCE_CYCLING = 'distanceCycling',
  ACTIVE_ENERGY_BURNED = 'activeEnergyBurned',
  BASAL_ENERGY_BURNED = 'basalEnergyBurned',
  HEART_RATE = 'heartRate',
  APPLE_EXERCISE_TIME = 'appleExerciseTime',
  BLOOD_GLUCOSE = 'bloodGlucose',
  SLEEP_ANALYSIS = 'sleepAnalysis',
  WEIGHT = 'weight',
  WORKOUT_TYPE = 'workoutType'
}

export enum HealthkitTopic {
  STEP_COUNT = 'active_apple_healthkit_steps',
  FLIGHTS_CLIMBED = 'active_apple_healthkit_stairs',
  DISTANCE_WALKING_RUNNING = 'active_apple_healthkit_distance',
  DISTANCE_CYCLING = 'active_apple_healthkit_distance',
  ACTIVE_ENERGY_BURNED = 'active_apple_healthkit_calories',
  BASAL_ENERGY_BURNED = 'active_apple_healthkit_calories',
  HEART_RATE = 'active_apple_healthkit_heart_rate',
  APPLE_EXERCISE_TIME = 'active_apple_healthkit_exercise_time',
  BLOOD_GLUCOSE = 'active_apple_healthkit_blood_glucose',
  SLEEP_ANALYSIS = 'active_apple_healthkit_sleep_stage',
  WEIGHT = 'active_apple_healthkit_weight',
  WORKOUT_TYPE = 'active_apple_healthkit_workout_type'
}

export const HealthkitFloatDataTypes = new Set([
  HealthkitDataType.STEP_COUNT,
  HealthkitDataType.FLIGHTS_CLIMBED,
  HealthkitDataType.DISTANCE_WALKING_RUNNING,
  HealthkitDataType.DISTANCE_CYCLING,
  HealthkitDataType.ACTIVE_ENERGY_BURNED,
  HealthkitDataType.BASAL_ENERGY_BURNED,
  HealthkitDataType.HEART_RATE,
  HealthkitDataType.APPLE_EXERCISE_TIME,
  HealthkitDataType.BLOOD_GLUCOSE,
  HealthkitDataType.WEIGHT
])

export const HealthkitStringDataTypes = new Set([
  HealthkitDataType.SLEEP_ANALYSIS,
  HealthkitDataType.WORKOUT_TYPE
])

export enum HealthKitDataTypeKey {
  STRING = 'stringValue',
  FLOAT = 'floatValue',
  DOUBLE = 'doubleValue'
}

export interface HealthkitValueExport {
  time: number
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
