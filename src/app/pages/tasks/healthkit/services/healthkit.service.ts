import { Injectable } from '@angular/core'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import {
  getMilliseconds,
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch
} from 'src/app/shared/utilities/time'
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit'
import { DefaultHealthkitInterval, DefaultHealthkitPermissions } from 'src/assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { ConfigKeys } from 'src/app/shared/enums/config'
import { HealthkitPermissionMap } from 'src/app/shared/models/health'
import { Utility } from 'src/app/shared/utilities/util'
import { QuestionnaireService } from 'src/app/core/services/config/questionnaire.service'
import { BehaviorSubject, Observable } from 'rxjs'
import { Task } from 'src/app/shared/models/task'

export interface HealthDataLoadContext {
  startTime: number
  lastProgressUpdate: number
  currentStage: string
}

export interface ProgressUpdate {
  progress: number
  message: string
  status: string
  eta?: string
  currentDataType?: string
}

@Injectable({
  providedIn: 'root'
})
export class HealthkitService {
  // The interval days for first query
  HEALTHKIT_INTERVAL_DAYS = String(DefaultHealthkitInterval)
  HEALTHKIT_PERMISSIONS = DefaultHealthkitPermissions
  DELIMITER = ','
  queryProgress = 0

  // Progress tracking
  private progressSubject = new BehaviorSubject<ProgressUpdate>({
    progress: 0,
    message: 'Ready',
    status: 'idle'
  })

  // Data storage for collection
  private healthAnswers: Record<string, any> = {}
  private healthTimestamps: Record<string, number> = {}
  private messageInterval: NodeJS.Timeout | null = null
  private uploadStartTime = 0
  private baseOffset = 0

  constructor(
    private storage: StorageService,
    private remoteConfig: RemoteConfigService,
    private util: Utility,
    private questionnaire: QuestionnaireService,
  ) {
    this.init()
  }

  init() {
    this.remoteConfig.read().then(config => {
      config
        .getOrDefault(
          ConfigKeys.HEALTHKIT_LOOKBACK_INTERVAL_DAYS,
          String(DefaultHealthkitInterval)
        )
        .then(interval =>
          (this.HEALTHKIT_INTERVAL_DAYS = interval)
        )
      config
        .getOrDefault(
          ConfigKeys.HEALTHKIT_PERMISSIONS,
          DefaultHealthkitPermissions.toString()
        )
        .then(permissions =>
          (this.HEALTHKIT_PERMISSIONS = this.util.stringToArray(permissions, this.DELIMITER))
        )
    })
  }

  // Progress tracking
  get progress$(): Observable<ProgressUpdate> {
    return this.progressSubject.asObservable()
  }

  private updateProgress(update: Partial<ProgressUpdate>): void {
    const current = this.progressSubject.value
    this.progressSubject.next({ ...current, ...update })
  }

  setProgressBaseOffset(offset: number): void {
    this.baseOffset = Math.min(Math.max(offset, 0), 99)
  }

  private adjustProgressWithOffset(progress: number): number {
    if (this.baseOffset === 0) return progress
    // Map progress from [0, 100] to [baseOffset, 100]
    return this.baseOffset + ((100 - this.baseOffset) * (progress / 100))
  }

  // Upload-ready flag controls
  async setUploadReadyFlag(isReady: boolean): Promise<void> {
    await this.storage.set(StorageKeys.HEALTHKIT_UPLOAD_READY, isReady)
  }

  async isUploadReady(): Promise<boolean> {
    const val = await this.storage.get(StorageKeys.HEALTHKIT_UPLOAD_READY)
    return Boolean(val)
  }

  checkHealthkitSupported() {
    return CapacitorHealthkit.isAvailable()
  }

  loadData(dataType, startTime) {
    return CapacitorHealthkit
      .requestAuthorization(
        {
          all: [''],
          read: this.HEALTHKIT_PERMISSIONS,
          write: [''],
        }
      )
      .then(() => {
        const endTime = new Date(
          startTime.getTime() + getMilliseconds({ days: Number(this.HEALTHKIT_INTERVAL_DAYS) }))
        return { startTime: startTime, endTime: endTime }
      })
      .catch(e => {
        console.log(e)
        return null
      })
  }

  async query(queryStartTime: Date, queryEndTime: Date, dataType: string) {
    try {
      let startTime = setDateTimeToMidnightEpoch(queryStartTime)
      let endTime = setDateTimeToMidnight(queryEndTime)
      const queryOptions = {
        sampleName: dataType,
        startDate: new Date(startTime).toISOString(),
        endDate: new Date(endTime).toISOString(),
        limit: 0 // This is to get all the data
      }
      return (await CapacitorHealthkit.queryHKitSampleType(queryOptions)).resultData
    } catch (e) {
      return []
    }
  }

  getDataTypesFromTask(task) {
    const type = task.type
    return this.questionnaire
      .getAssessmentForTask(type, task)
      .then(assessment => {
        const questions = assessment.questions
        return questions.map(question => question.field_name)
      })
  }

  // Data collection and processing methods
  async collectHealthData(task: Task): Promise<{ answers: Record<string, any>, timestamps: Record<string, number> }> {
    if (!task) {
      throw new Error('No task available for health data collection')
    }

    this.updateProgress({
      message: 'Requesting HealthKit permissions...',
      status: 'collecting'
    })

    // Reset previous data
    this.healthAnswers = {}
    this.healthTimestamps = {}
    const currentTime = Date.now()

    // Collect data for each supported health type
    const healthDataTypes = await this.getDataTypesFromTask(task)
    const totalTypes = healthDataTypes.length

    for (let i = 0; i < totalTypes; i++) {
      const dataType = healthDataTypes[i]

      try {
        const collectionProgress = Math.round((i / totalTypes) * 25) // Collection is 25% of remaining progress
        const adjustedProgress = this.adjustProgressWithOffset(collectionProgress)

        this.updateProgress({
          message: `Collecting ${this.formatDataTypeName(dataType)} data...`,
          progress: adjustedProgress
        })

        const data = await this.loadData(dataType, new Date(task.timestamp))

        if (data && data.startTime && data.endTime) {
          this.healthAnswers[dataType] = {
            startTime: data.startTime,
            endTime: data.endTime
          }
          this.healthTimestamps[dataType] = currentTime

          console.log(`Successfully stored ${dataType} data:`, {
            startTime: data.startTime,
            endTime: data.endTime
          })
        } else {
          console.warn(`No data returned for ${dataType}`)
        }
      } catch (error) {
        console.warn(`Failed to load ${dataType} data:`, error)
        // Continue with other data types even if one fails
      }
    }

    // Validate that we have at least some health data
    if (Object.keys(this.healthAnswers).length === 0) {
      throw new Error('No health data could be collected from any supported data types')
    }

    const finalCollectionProgress = this.adjustProgressWithOffset(25)
    this.updateProgress({
      message: 'Collection completed, processing and uploading...',
      progress: finalCollectionProgress,
      status: 'processing'
    })

    this.startProgressMessages()

    return {
      answers: { ...this.healthAnswers },
      timestamps: { ...this.healthTimestamps }
    }
  }

  private startProgressMessages(): void {
    const progressMessages = [
      'Starting the upload...',
      'Thank you for your patience...',
      'We are working on it...'
    ]

    if (this.messageInterval) {
      clearInterval(this.messageInterval)
    }

    this.messageInterval = setInterval(() => {
      this.updateProgress({
        message: progressMessages[Math.floor(Math.random() * progressMessages.length)]
      })
    }, 5000)
  }

  stopProgressMessages(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval)
      this.messageInterval = null
    }
  }

  formatDataTypeName(dataType: string): string {
    // Convert camelCase to readable format
    const formatted = dataType
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim()

    // Handle special cases
    const specialCases: Record<string, string> = {
      'Heart Rate': 'Heart Rate',
      'Sleep Analysis': 'Sleep Analysis',
      'Active Energy Burned': 'Active Energy',
      'Steps': 'Steps'
    }

    return specialCases[formatted] || formatted
  }

  updateKafkaProgress(progress: number, baseOffset: number = 0): void {
    // Update the base offset if provided
    if (baseOffset > 0) {
      this.setProgressBaseOffset(baseOffset)
    }

    const kafkaProgressPercentage = Math.min(Math.max(progress * 100, 0), 100)
    // Map kafka progress to the remaining portion after collection (25% to 100%)
    const remainingProgress = 25 + (75 * (kafkaProgressPercentage / 100))
    const overallProgress = this.adjustProgressWithOffset(remainingProgress)
    const finalProgress = Math.min(100, Math.round(overallProgress))

    // Start timing on first progress update
    if (this.uploadStartTime === 0 && kafkaProgressPercentage > 0) {
      this.uploadStartTime = Date.now()
    }

    if (kafkaProgressPercentage < 100) {
      // Build detailed progress message with ETA and data info
      let message = `Uploading to server: ${Math.round(kafkaProgressPercentage)}%`

      // Calculate and add ETA
      const etaText = this.calculateTimeRemaining(kafkaProgressPercentage)
      if (etaText) {
        message += `<br>${etaText}`
      }

      // Add information about data being sent
      const dataInfo = this.buildDataTypeInfoMessage(finalProgress)
      if (dataInfo) {
        message += `<br><br>${dataInfo}`
      }

      this.updateProgress({
        progress: finalProgress,
        message: message,
        status: 'uploading',
        eta: etaText
      })
    } else {
      this.updateProgress({
        progress: finalProgress,
        message: 'All health data has been uploaded successfully',
        status: kafkaProgressPercentage >= 100 ? 'complete' : 'uploading'
      })
    }
  }

  private calculateTimeRemaining(progressPercentage: number): string {
    if (this.uploadStartTime === 0 || progressPercentage <= 0) {
      return ''
    }

    const elapsedTime = (Date.now() - this.uploadStartTime) / 1000
    const remainingTime = isFinite(elapsedTime * (100 - progressPercentage) / progressPercentage)
      ? (elapsedTime * (100 - progressPercentage)) / progressPercentage
      : 0

    if (remainingTime >= 60) {
      const minutes = Math.floor(remainingTime / 60)
      const seconds = Math.round(remainingTime % 60)
      return `About ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
    } else if (remainingTime > 5) {
      return `About ${remainingTime.toFixed(0)} second${remainingTime.toFixed(0) !== '1' ? 's' : ''} remaining`
    }

    return ''
  }

  private buildDataTypeInfoMessage(currentProgress: number): string {
    const dataTypeEntries = Object.entries(this.healthAnswers)
    if (dataTypeEntries.length === 0) {
      return ''
    }

    // Calculate which data type is currently being processed
    const totalDataTypes = dataTypeEntries.length

    if (currentProgress >= 100) {
      // All data types completed
      return `<small><strong>Completed all data types</strong></small>`
    }

    // Estimate current data type based on progress
    // Each data type gets roughly equal share of the progress
    const progressPerDataType = 100 / totalDataTypes
    const currentIndex = Math.min(
      Math.floor(currentProgress / progressPerDataType),
      totalDataTypes - 1
    )

    // Calculate progress within the current data type
    const progressInCurrentType = (currentProgress % progressPerDataType) / progressPerDataType * 100

    const [currentDataType, dateRange] = dataTypeEntries[currentIndex]
    const startDate = new Date(dateRange.startTime).toLocaleDateString()
    const endDate = new Date(dateRange.endTime).toLocaleDateString()

    // Format the current data type name
    const formattedType = this.formatDataTypeName(currentDataType)

    // Show current data type with its progress
    let message = `<small><strong>Processing:</strong> ${formattedType}<br>`
    message += `<strong>Date range:</strong> ${startDate} - ${endDate}<br>`
    message += `<strong>Progress:</strong> ${Math.round(progressInCurrentType)}% of this data type`

    // Show which data type number we're on
    if (totalDataTypes > 1) {
      message += `<br><strong>Data type:</strong> ${currentIndex + 1} of ${totalDataTypes}`
    }

    message += '</small>'

    return message
  }

  resetProgress(): void {
    this.stopProgressMessages()
    this.uploadStartTime = 0
    this.baseOffset = 0
    this.updateProgress({
      progress: 0,
      message: 'Ready',
      status: 'idle'
    })
  }

  // Get stored data for debugging/testing
  getStoredHealthAnswers(): Record<string, any> {
    return { ...this.healthAnswers }
  }

  getStoredHealthTimestamps(): Record<string, number> {
    return { ...this.healthTimestamps }
  }

  cleanup(): void {
    this.stopProgressMessages()
    this.uploadStartTime = 0
    this.baseOffset = 0
    this.healthAnswers = {}
    this.healthTimestamps = {}
  }
}
