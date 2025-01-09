export enum HealthkitPermission {
  STAIRS = 'stairs',
  DISTANCE = 'distance',
  DURATION = 'duration',
  ACTIVITY = 'activity',
  CALORIES = 'calories',
  BLOOD_GLUCOSE = 'bloodGlucose',
  WEIGHT = 'weight',
  HEART_RATE = 'heartRate',
  STEPS = 'steps',
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
  WORKOUT_TYPE = 'workoutType',
  OXYGEN_SATURATION = 'oxygenSaturation',
  BLOOD_PRESSURE_SYSTOLIC = 'blooPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC = 'bloodPressureDiastolic',
  RESTING_HEART_RATE = 'restingHeartRate',
  RESPIRATORY_RATE = 'respiratoryRate'
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
  WORKOUT_TYPE = 'active_apple_healthkit_activity',
  OXYGEN_SATURATION = 'active_apple_healthkit_oxygen_saturation',
  BLOOD_PRESSURE_SYSTOLIC = 'active_apple_healthkit_blood_pressure',
  BLOOD_PRESSURE_DIASTOLIC = 'active_apple_healthkit_blood_pressure',
  RESTING_HEART_RATE = 'active_apple_healthkit_heart_rate',
  RESPIRATORY_RATE = 'active_apple_healthkit_resp_rate'
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
  HealthkitDataType.WEIGHT,
  HealthkitDataType.OXYGEN_SATURATION,
  HealthkitDataType.BLOOD_PRESSURE_DIASTOLIC,
  HealthkitDataType.BLOOD_PRESSURE_SYSTOLIC,
  HealthkitDataType.RESPIRATORY_RATE,
  HealthkitDataType.RESTING_HEART_RATE
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

export enum HealthKitDataKey {
  DEFAULT = 'value',
  SLEEP_STATE = 'sleepState',
  ACTIVITY_TYPE = 'workoutActivityName'
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

export const HealthkitPermissionMap = {
  [HealthkitDataType.STEP_COUNT]: HealthkitPermission.STEPS,
  [HealthkitDataType.FLIGHTS_CLIMBED]: HealthkitPermission.STAIRS,
  [HealthkitDataType.DISTANCE_WALKING_RUNNING]: HealthkitPermission.DISTANCE,
  [HealthkitDataType.DISTANCE_CYCLING]: HealthkitPermission.DISTANCE,
  [HealthkitDataType.ACTIVE_ENERGY_BURNED]: HealthkitPermission.CALORIES,
  [HealthkitDataType.BASAL_ENERGY_BURNED]: HealthkitPermission.CALORIES,
  [HealthkitDataType.HEART_RATE]: HealthkitPermission.HEART_RATE,
  [HealthkitDataType.RESTING_HEART_RATE]: HealthkitPermission.HEART_RATE,
  [HealthkitDataType.APPLE_EXERCISE_TIME]: HealthkitPermission.DURATION,
  [HealthkitDataType.BLOOD_GLUCOSE]: HealthkitPermission.BLOOD_GLUCOSE,
  [HealthkitDataType.SLEEP_ANALYSIS]: HealthkitPermission.ACTIVITY,
  [HealthkitDataType.WORKOUT_TYPE]: HealthkitPermission.ACTIVITY,
  [HealthkitDataType.WEIGHT]: HealthkitPermission.WEIGHT,
}
