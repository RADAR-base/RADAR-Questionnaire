import { Observable, BehaviorSubject } from 'rxjs'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { Utility } from 'src/app/shared/utilities/util'
import { QuestionnaireService } from 'src/app/core/services/config/questionnaire.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import { ConfigKeys } from 'src/app/shared/enums/config'
import { DefaultHealthkitInterval, DefaultHealthkitPermissions, DefaultHealthkitShowEtaText } from 'src/assets/data/defaultConfig'
import { Task } from 'src/app/shared/models/task'
import { setDateTimeToMidnight, setDateTimeToMidnightEpoch, getMilliseconds } from 'src/app/shared/utilities/time'

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

export abstract class HealthPlatformBaseService {
    HEALTHKIT_INTERVAL_DAYS = String(DefaultHealthkitInterval)
    HEALTHKIT_PERMISSIONS = DefaultHealthkitPermissions
    DELIMITER = ','

    // Auth state
    protected isRequestingAuthorization = false
    protected authorizationPromise: Promise<void> | null = null
    protected authRetryDelayMs = 1000

    // Progress tracking
    protected progressSubject = new BehaviorSubject<ProgressUpdate>({
        progress: 0,
        message: 'Ready',
        status: 'idle'
    })

    // Data storage for collection
    protected healthAnswers: Record<string, any> = {}
    protected healthTimestamps: Record<string, number> = {}
    protected messageInterval: NodeJS.Timeout | null = null
    protected messageTimeouts: NodeJS.Timeout[] = []
    protected uploadStartTime = 0
    protected baseOffset = 0
    protected showEtaText = false

    constructor(
        protected storage: StorageService,
        protected remoteConfig: RemoteConfigService,
        protected util: Utility,
        protected questionnaire: QuestionnaireService
    ) {
        this.init()
    }

    // Abstract platform hooks
    protected abstract platformAttemptAuthorization(): Promise<void>
    protected abstract platformCheckAvailable(): Promise<any>
    abstract query(queryStartTime: Date, queryEndTime: Date, dataType: string): Promise<any[]>

    // Public API used by components/services
    get progress$(): Observable<ProgressUpdate> {
        return this.progressSubject.asObservable()
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
                    await this.platformAttemptAuthorization()
                    return
                } catch (error) {
                    // Retry with backoff indefinitely
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

    checkHealthkitSupported() {
        return this.platformCheckAvailable()
    }

    protected delay(ms: number): Promise<void> {
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

    protected updateProgress(update: Partial<ProgressUpdate>): void {
        const current = this.progressSubject.value
        const next = { ...current, ...update }
        if (update.message === undefined || update.message === '') {
            next.message = current.message
        }
        this.progressSubject.next(next as ProgressUpdate)
    }

    setProgressBaseOffset(offset: number): void {
        this.baseOffset = Math.min(Math.max(offset, 0), 99)
    }

    protected adjustProgressWithOffset(progress: number): number {
        if (this.baseOffset === 0) return progress
        return this.baseOffset + ((100 - this.baseOffset) * (progress / 100))
    }

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

    async loadData(dataType, startTime) {
        try {
            const endTime = new Date(
                startTime.getTime() + getMilliseconds({ days: Number(this.HEALTHKIT_INTERVAL_DAYS) }))
            return { startTime: startTime, endTime: endTime }
        } catch (e) {
            return null
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

    async collectHealthData(task: Task): Promise<{ answers: Record<string, any>, timestamps: Record<string, number> }> {
        if (!task) {
            throw new Error('No task available for health data collection')
        }

        this.updateProgress({
            progress: 0,
            message: 'Requesting Health permissions...',
            status: 'collecting'
        })

        await this.requestHealthkitAuthorization()

        this.healthAnswers = {}
        this.healthTimestamps = {}
        const currentTime = Date.now()

        const healthDataTypes = await this.getDataTypesFromTask(task)
        const totalTypes = healthDataTypes.length

        for (let i = 0; i < totalTypes; i++) {
            const dataType = healthDataTypes[i]
            try {
                const collectionProgress = Math.round((i / totalTypes) * 15)
                const adjustedProgress = this.adjustProgressWithOffset(collectionProgress)
                this.updateProgress({
                    message: `Collecting ${this.formatDataTypeName(dataType)} data...`,
                    progress: adjustedProgress
                })
                const data = await this.loadData(dataType, new Date(task.timestamp))
                if (data && data.startTime && data.endTime) {
                    this.healthAnswers[dataType] = { startTime: data.startTime, endTime: data.endTime }
                    this.healthTimestamps[dataType] = currentTime
                }
            } catch (_) { }
        }

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

    protected startProgressMessages(): void {
        if (this.messageInterval) {
            clearInterval(this.messageInterval)
        }
        this.clearMessageTimeouts()
        const messageTimeouts = [
            { time: 60000, message: 'Data upload in progress' },
            { time: 180000, message: 'Data upload in progress' },
            { time: 360000, message: 'This is taking a bit longer than expected, please hang in there' },
            { time: 720000, message: "Still uploading. Let's give it another 8 minutes" }
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

    protected clearMessageTimeouts(): void {
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

    protected formatDataTypeName(dataType: string): string {
        const formatted = dataType
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim()
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
        if (baseOffset > 0) {
            this.setProgressBaseOffset(baseOffset)
        }
        const kafkaProgressPercentage = Math.min(Math.max(progress * 100, 0), 100)
        const mappedProgress = this.baseOffset > 0
            ? kafkaProgressPercentage
            : 15 + (85 * (kafkaProgressPercentage / 100))
        const overallProgress = this.adjustProgressWithOffset(mappedProgress)
        const finalProgress = Math.min(100, Math.floor(overallProgress))
        if (this.uploadStartTime === 0 && kafkaProgressPercentage > 0) {
            this.uploadStartTime = Date.now()
        }
        if (kafkaProgressPercentage < 100) {
            let message = ``
            const etaText = this.showEtaText ? this.calculateTimeRemaining(kafkaProgressPercentage) : ''
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

    protected calculateTimeRemaining(progressPercentage: number): string {
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
            if (hours === 0) {
                return `About ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
            }
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

    reset(): void {
        this.setTotalHealthkitDataCount(0).catch(() => { })
        this.setUploadReadyFlag(false).catch(() => { })
    }

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

// Abstract token for DI clarity
export abstract class HealthPlatformService extends HealthPlatformBaseService { }


