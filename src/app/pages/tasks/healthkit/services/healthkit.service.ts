import { Injectable } from '@angular/core'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import {
  getMilliseconds,
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch
} from 'src/app/shared/utilities/time'
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit'
import {
  DefaultHealthkitInterval,
  DefaultHealthkitPermissions,
  DefaultHealthkitShowEtaText
} from 'src/assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { ConfigKeys } from 'src/app/shared/enums/config'
import { HealthkitPermissionMap } from 'src/app/shared/models/health'
import { Utility } from 'src/app/shared/utilities/util'
import { QuestionnaireService } from 'src/app/core/services/config/questionnaire.service'
import { BehaviorSubject, Observable } from 'rxjs'
import { Task } from 'src/app/shared/models/task'
import { App } from '@capacitor/app'

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

export interface AttemptProgress {
  success: number
  failed: number
  cacheSize: number
}

type HKitSample = Record<string, any> & { uuid?: string; startDate?: string; endDate?: string };

@Injectable({
  providedIn: 'root'
})
export class HealthkitService {
  // The interval days for first query
  HEALTHKIT_INTERVAL_DAYS = String(DefaultHealthkitInterval)
  HEALTHKIT_PERMISSIONS = DefaultHealthkitPermissions
  DELIMITER = ','
  queryProgress = 0

  // Track if a HealthKit authorization prompt is outstanding
  private isRequestingAuthorization = false
  private authorizationPromise: Promise<void> | null = null
  private authRetryDelayMs = 1000

  // Progress tracking
  private progressSubject = new BehaviorSubject<ProgressUpdate>({
    progress: 0,
    message: '',
    status: 'idle'
  })

  // Data storage for collection
  private healthAnswers: Record<string, any> = {}
  private healthTimestamps: Record<string, number> = {}
  private messageInterval: NodeJS.Timeout | null = null
  private messageTimeouts: NodeJS.Timeout[] = []
  private uploadStartTime = 0
  private baseOffset = 0
  private showEtaText = false

  constructor(
    private storage: StorageService,
    private remoteConfig: RemoteConfigService,
    private util: Utility,
    private questionnaire: QuestionnaireService,
  ) {
    this.init()
  }

  async requestHealthkitAuthorization(): Promise<void> {
    if (this.authorizationPromise) {
      return this.authorizationPromise
    }

    this.isRequestingAuthorization = true
    this.authorizationPromise = (async () => {
      let delayMs = this.authRetryDelayMs
      for (; ;) {
        try {
          await CapacitorHealthkit.requestAuthorization({
            all: [],
            read: this.HEALTHKIT_PERMISSIONS,
            write: []
          })
          return
        } catch (error) {
          console.warn('HealthKit authorization request failed, retrying...', error)
          await this.delay(delayMs)
          delayMs = Math.min(delayMs * 2, 60000)
        }
      }
    })().finally(() => {
      this.isRequestingAuthorization = false
      this.authorizationPromise = null
    })

    return this.authorizationPromise
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
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
      config
        .getOrDefault(
          ConfigKeys.HEALTHKIT_SHOW_ETA_TEXT,
          DefaultHealthkitShowEtaText
        )
        .then(showEta =>
          (this.showEtaText = showEta.toLowerCase() === 'true')
        )
    })
  }

  // Progress tracking
  get progress$(): Observable<ProgressUpdate> {
    return this.progressSubject.asObservable()
  }

  private updateProgress(update: Partial<ProgressUpdate>): void {
    const current = this.progressSubject.value
    // Preserve the existing message if the update doesn't provide one or is empty
    const next = { ...current, ...update }
    if (update.message === undefined || update.message === '') {
      next.message = current.message
    }
    this.progressSubject.next(next as ProgressUpdate)
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

  async getTotalHealthkitDataCount(): Promise<number> {
    const val = await this.storage.get(StorageKeys.HEALTHKIT_TOTAL_DATA_COUNT)
    return val ? Number(val) : 0
  }

  async setTotalHealthkitDataCount(count: number): Promise<void> {
    await this.storage.set(StorageKeys.HEALTHKIT_TOTAL_DATA_COUNT, count)
  }

  checkHealthkitSupported() {
    return CapacitorHealthkit.isAvailable()
  }

  async loadData(dataType, startTime) {
    try {
      const endTime = new Date(
        startTime.getTime() + getMilliseconds({ days: Number(this.HEALTHKIT_INTERVAL_DAYS) }))
      return { startTime: startTime, endTime: endTime }
    } catch (e) {
      console.log(e)
      return null
    }
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

  async queryPage(
    queryStartTime: Date,
    queryEndTime: Date,
    dataType: string,
    limit: number
  ): Promise<HKitSample[]> {
    try {
        const queryOptions = {
        sampleName: dataType,
        startDate: queryStartTime.toISOString(),
        endDate: queryEndTime.toISOString(),
        limit,
      }

      const res = await CapacitorHealthkit.queryHKitSampleType(queryOptions)
      const rows: HKitSample[] = res?.resultData ?? []

      return rows
    } catch {
      return []
    }
  }

  private getSampleId(sample: HKitSample): string {
    return sample.uuid ?? `${sample.startDate}|${sample.endDate}`
  }

  queryPaged$(
    queryStartTime: Date,
    queryEndTime: Date,
    dataType: string,
    pageSize = 28800
  ): Observable<HKitSample[]> {
    return new Observable<HKitSample[]>(subscriber => {
      console.log('query start: ', queryStartTime, queryEndTime, dataType)
      let cancelled = false
      ;(async () => {
        try {
          let cursorStartMs = setDateTimeToMidnightEpoch(queryStartTime)
          const queryEnd = queryEndTime
          let boundaryStartMs = cursorStartMs
          let boundaryUUIDs = new Set<string>()

          while (!cancelled) {
            console.log('cursorStartMs', new Date(cursorStartMs).toISOString(), 'boundaryStartMs', new Date(boundaryStartMs), 'queryStart', queryStartTime, 'queryEnd', queryEndTime)
            if (cursorStartMs > queryEnd.getTime()) {
              subscriber.complete()
              return
            }

            const page = await this.queryPage(new Date(cursorStartMs), queryEnd, dataType, pageSize)
            if (!page.length) {
              subscriber.complete()
              return
            }

            const filtered: HKitSample[] = []
            for (const s of page) {
              const sStartMs = +new Date(s.startDate)
              if (!Number.isFinite(sStartMs) || sStartMs < cursorStartMs) continue
              const id = this.getSampleId(s)
              if (sStartMs === boundaryStartMs && boundaryUUIDs.has(id)) continue
              filtered.push(s)
            }

            if (!filtered.length) {
              cursorStartMs = boundaryStartMs + 1
              boundaryStartMs = cursorStartMs
              boundaryUUIDs = new Set<string>()
              continue
            }

            subscriber.next(filtered)

            const last = filtered[filtered.length - 1]
            const lastStartMs = +new Date(last.startDate)
            const lastBoundaryIds = new Set<string>(
              filtered
                .filter(s => +new Date(s.startDate) === lastStartMs)
                .map(s => this.getSampleId(s))
            )

            if (lastStartMs === boundaryStartMs) {
              lastBoundaryIds.forEach(id => boundaryUUIDs.add(id))
            } else {
              boundaryStartMs = lastStartMs
              boundaryUUIDs = lastBoundaryIds
            }
            cursorStartMs = boundaryStartMs
          }
        } catch (e) {
          subscriber.error(e)
        }
      })()

      return () => {
        cancelled = true
      }
    })
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
      progress: 0,
      message: '',
      status: 'collecting'
    })

    await this.requestHealthkitAuthorization()

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
        const collectionProgress = Math.round((i / totalTypes) * 15) // Collection is 15% of remaining progress
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

    const finalCollectionProgress = this.adjustProgressWithOffset(15)
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
    if (this.messageInterval) {
      clearInterval(this.messageInterval)
    }
    this.clearMessageTimeouts()

    // Set up timed messages at specific intervals
    const messageTimeouts = [
      { time: 60000, message: 'Data upload in progress' },      // 1 minute
      { time: 180000, message: 'Data upload in progress' },     // 3 minutes
      { time: 360000, message: 'This is taking a bit longer than expected, please hang in there' }, // 6 minutes
      { time: 720000, message: "Still uploading. Let's give it another 8 minutes" } // 12 minutes
    ]

    messageTimeouts.forEach(({ time, message }) => {
      const timeoutId = setTimeout(() => {
        const shownMessage = message
        this.updateProgress({ message: shownMessage })

        setTimeout(() => {
          if (this.progressSubject.value.message === shownMessage) {
            this.updateProgress({ message: ' ' })
          }
        }, 30000)
      }, time)
      this.messageTimeouts.push(timeoutId)
    })
  }

  private clearMessageTimeouts(): void {
    this.messageTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
    this.messageTimeouts = []
  }

  stopProgressMessages(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval)
      this.messageInterval = null
    }
    this.clearMessageTimeouts()
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
    if (this.isRequestingAuthorization) {
      return
    }

    // Update the base offset if provided
    if (baseOffset > 0) {
      this.setProgressBaseOffset(baseOffset)
    }

    const kafkaProgressPercentage = Math.min(Math.max(progress * 100, 0), 100)
    // If we have a baseOffset (e.g., resuming), start from that exact percentage and
    // let kafka progress map across the remaining range. Otherwise, map into 15..100.
    const mappedProgress = this.baseOffset > 0
      ? kafkaProgressPercentage
      : 15 + (85 * (kafkaProgressPercentage / 100))
    const overallProgress = this.adjustProgressWithOffset(mappedProgress)
    const finalProgress = Math.min(100, Math.floor(overallProgress))

    // Start timing on first progress update
    if (this.uploadStartTime === 0 && kafkaProgressPercentage > 0) {
      this.uploadStartTime = Date.now()
    }

    if (kafkaProgressPercentage < 100) {
      // Build detailed progress message with ETA and data info
      let message = ``

      // Calculate and add ETA only if enabled in config
      const etaText =
        this.showEtaText ? this.calculateTimeRemaining(kafkaProgressPercentage) : ''
      if (etaText) {
        message += `${etaText}`
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
        message: 'Almost done...',
        status: 'uploading'
      })
    }
  }

  private calculateTimeRemaining(progressPercentage: number): string {
    const defaultMessage = 'Calculating ETA...'
    if (this.uploadStartTime === 0 || progressPercentage <= 0) {
      return defaultMessage
    }

    const elapsedTime = (Date.now() - this.uploadStartTime) / 1000
    const remainingTime = isFinite(elapsedTime * (100 - progressPercentage) / progressPercentage)
      ? (elapsedTime * (100 - progressPercentage)) / progressPercentage
      : 0

    if (remainingTime >= 60) {
      const hours = Math.floor(remainingTime / 3600)
      const minutes = Math.floor(remainingTime / 60) - (hours * 60)
      const seconds = Math.round(remainingTime % 60)
      // If hours are 0, return minutes and seconds
      if (hours === 0) {
        return `About ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
      }
      // If hours are not 0, return hours and minutes
      return `About ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''} remaining`
    } else if (remainingTime > 5) {
      return `About ${remainingTime.toFixed(0)} second${remainingTime.toFixed(0) !== '1' ? 's' : ''} remaining`
    }

    return defaultMessage
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

  reset() {
    this.setTotalHealthkitDataCount(0)
    this.setUploadReadyFlag(false)
  }
}
