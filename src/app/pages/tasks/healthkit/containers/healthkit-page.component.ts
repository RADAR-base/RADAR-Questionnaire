import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { AlertService } from '../../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { UsageService } from '../../../../core/services/usage/usage.service'
import { ConfigService } from '../../../../core/services/config/config.service'
import { UsageEventType } from '../../../../shared/enums/events'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { HealthkitService } from '../services/healthkit.service'
import { HealthQuestionnaireProcessorService } from '../services/questionnaire-processor/health-questionnaire-processor.service'

interface HealthDataLoadContext {
  startTime: number
  lastProgressUpdate: number
  currentStage: string
}

@Component({
  selector: 'page-healthkit',
  templateUrl: 'healthkit-page.component.html',
  styleUrls: ['healthkit-page.component.scss']
})
export class HealthkitPageComponent implements OnInit, OnDestroy {

  // Component state
  task: Task | null = null
  isHealthKitSupported = false
  isDataProcessing = false
  dataProcessingComplete = false
  hasProcessingError = false

  DATA_UPLOAD_TIMEOUT = 1_200_000 // 20 minutes

  // UI display values
  statusMessage = 'Checking HealthKit support...'
  progressMessage = ''
  currentProgress = 0

  // Progress tracking for ETA calculation
  private uploadStartTime = 0
  private lastProgressUpdate = 0

  // Local storage for health data answers (similar to AnswerService)
  private healthAnswers: Record<string, any> = {}
  private healthTimestamps: Record<string, number> = {}

  private kafkaProgressSubscription: Subscription = new Subscription()

  constructor(
    public navCtrl: NavController,
    private usage: UsageService,
    private platform: Platform,
    private localization: LocalizationService,
    private router: Router,
    private alertService: AlertService,
    private configService: ConfigService,
    private healthkitService: HealthkitService,
    private healthProcessor: HealthQuestionnaireProcessorService
  ) {
    // Get task from navigation state
    const navigation = this.router.getCurrentNavigation()
    if (navigation?.extras?.state) {
      this.task = navigation.extras.state as Task
    }
  }

  ngOnInit(): void {
    this.usage.setPage(this.constructor.name)
    this.initializeHealthKitSupport()
  }

  ngOnDestroy(): void {
    this.cleanup()
    KeepAwake.allowSleep()
  }

  ionViewDidEnter(): void {
    KeepAwake.keepAwake()
  }

  ionViewWillLeave(): void {
    this.cleanup()
    KeepAwake.allowSleep()
  }

  // Public methods for UI interaction
  async startHealthDataCollection(): Promise<void> {
    if (!this.isHealthKitSupported || !this.task) {
      return
    }

    this.usage.sendClickEvent('start_health_data_collection')
    await this.performHealthDataProcessing()
  }

  handleFinish(): void {
    this.navCtrl.navigateRoot('/home')
    this.usage.sendClickEvent('finish_healthkit_task')
  }

  retryProcessing(): void {
    this.resetUIState()
    this.performCacheUploadOnly()
  }

  private resetUIState(): void {
    this.isDataProcessing = false
    this.dataProcessingComplete = false
    this.hasProcessingError = false
    this.currentProgress = 0
    this.progressMessage = ''
    this.statusMessage = 'Retrying upload...'

    this.uploadStartTime = 0
    this.lastProgressUpdate = 0

  }

  private async performCacheUploadOnly(): Promise<void> {
    this.isDataProcessing = true
    this.currentProgress = 0
    this.progressMessage = 'Retrying upload...'
    this.statusMessage = 'Uploading remaining health data...'

    const context = this.initializeProcessingContext()
    const processingTimeout = this.setupProcessingTimeout()

    try {
      this.setupProgressTracking(context)

      await this.healthProcessor.sendAllFromCache()

      this.handleProcessingSuccess(processingTimeout)
    } catch (error) {
      this.handleProcessingError(processingTimeout, error)
    }
  }

  // Private initialization methods
  private async initializeHealthKitSupport(): Promise<void> {
    try {
      this.statusMessage = 'Checking HealthKit support...'
      await this.healthkitService.checkHealthkitSupported()
      this.isHealthKitSupported = true
      this.statusMessage = `We will collect your physical activity, and related Apple Health data (e.g., heart rate). Tap the button below to initiate the data retrieval process.`
      this.usage.sendGeneralEvent(UsageEventType.APP_OPEN)
    } catch (error) {
      this.isHealthKitSupported = false
      this.statusMessage = 'HealthKit is not supported on this device'
      this.handleHealthKitError(error)
    }
  }

  // Private health data processing methods
  private async performHealthDataProcessing(): Promise<void> {
    // Set processing state to show inline loading
    this.isDataProcessing = true
    this.currentProgress = 0
    this.progressMessage = 'Initializing...'
    this.statusMessage = 'Starting health data processing...'

    const context = this.initializeProcessingContext()
    const processingTimeout = this.setupProcessingTimeout()

    try {
      this.setupProgressTracking(context)

      // Step 1: Collect and store health data (like questions page does)
      await this.collectAndStoreHealthData()

      // Step 2: Process stored health data (like questions page does)
      await this.processStoredHealthData(context)

      // Check cache size
      const cacheSize = await this.healthProcessor.getCacheSize()
      if (cacheSize > 1) {
        this.handleProcessingError(processingTimeout, new Error('Some data failed to send'))
      } else {
        this.handleProcessingSuccess(processingTimeout)
      }
    } catch (error) {
      this.handleProcessingError(processingTimeout, error)
    }
  }

  private async collectAndStoreHealthData(): Promise<void> {
    if (!this.task) {
      throw new Error('No task available for health data collection')
    }

    console.log('Starting health data collection...')
    this.statusMessage = 'Collecting health data from HealthKit...'
    this.progressMessage = 'Requesting HealthKit permissions...'

    // Reset previous data
    this.healthAnswers = {}
    this.healthTimestamps = {}
    const currentTime = Date.now()

    // Collect data for each supported health type
    const healthDataTypes = await this.healthkitService.getDataTypesFromTask(this.task)
    const totalTypes = healthDataTypes.length
    for (let i = 0; i < totalTypes; i++) {
      const dataType = healthDataTypes[i]

      try {
        console.log(`Loading ${dataType} data...`)
        this.progressMessage = `Collecting ${dataType} data...`

        // Use the healthkit service loadData method which returns date intervals
        const data = await this.healthkitService.loadData(dataType, new Date(this.task.timestamp))

        if (data && data.startTime && data.endTime) {
          // Store in local answers cache (similar to AnswerService.add())
          this.healthAnswers[dataType] = {
            startTime: data.startTime,
            endTime: data.endTime
          }

          // Store timestamp for when this data was collected
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

    console.log('Health data collection completed. Stored answers:', this.healthAnswers)
    this.statusMessage = 'Health data collected, starting processing...'
    this.progressMessage = 'Collection completed, processing and uploading...'
  }

  private async processStoredHealthData(context: HealthDataLoadContext): Promise<void> {
    if (!this.task) {
      throw new Error('No task available for processing')
    }

    console.log('Starting health data processing from stored answers...')
    this.statusMessage = 'Processing and uploading health data...'
    this.progressMessage = 'Processing data...'

    // Create the data structure in the same format as questions page getData()
    const healthData = {
      answers: this.healthAnswers,
      timestamps: this.healthTimestamps,
      time: this.task.timestamp,        // Task start time
      timeCompleted: Date.now()         // Current time as completion time
    }

    console.log('Processing health data structure:', healthData)

    // Use the health questionnaire processor to handle the data
    // This is the same call as questions page makes
    return this.healthProcessor.process(
      healthData,
      this.task,
      { type: 'healthkit', timestamp: Date.now() }
    )
  }

  private initializeProcessingContext(): HealthDataLoadContext {
    return {
      startTime: Date.now(),
      lastProgressUpdate: 0,
      currentStage: 'initialization'
    }
  }

  private setupProcessingTimeout(): NodeJS.Timeout {
    return setTimeout(() => {
      if (this.isDataProcessing) {
        this.showProcessingTimeoutDialog()
      }
    }, this.DATA_UPLOAD_TIMEOUT)
  }

  private setupProgressTracking(context: HealthDataLoadContext): void {
    // Track only kafka service progress for the entire process
    const kafkaService = this.configService.getKafkaService()
    this.kafkaProgressSubscription = kafkaService.eventCallback$.subscribe({
      next: (progress: number) => this.handleKafkaProgress(progress),
      error: (error) => this.handleProgressError(error)
    })
  }

  // Private progress handling methods
  private handleKafkaProgress(progress: number): void {
    try {
      // Use kafka progress directly (0-100%)
      const kafkaProgressPercentage = Math.min(Math.max(progress * 100, 0), 100)
      this.currentProgress = Number(kafkaProgressPercentage.toFixed(0))

      // Start timing on first progress update
      if (this.uploadStartTime === 0 && kafkaProgressPercentage > 0) {
        this.uploadStartTime = Date.now()
      }

      if (kafkaProgressPercentage < 100) {
        this.statusMessage = 'Uploading health data...'

        // Build detailed progress message with ETA and data info
        let message = `Uploading to server: ${Math.round(kafkaProgressPercentage)}%`

        // Calculate and add ETA
        const etaText = this.calculateTimeRemaining(kafkaProgressPercentage)
        if (etaText) {
          message += `<br>${etaText}`
        }

        // Add information about data being sent
        const dataInfo = this.buildDataTypeInfoMessage()
        if (dataInfo) {
          message += `<br><br>${dataInfo}`
        }

        this.progressMessage = message
      } else {
        this.currentProgress = 100
        this.statusMessage = 'Upload complete!'
        this.progressMessage = 'All health data has been uploaded successfully'
      }

    } catch (error) {
      console.error('Error updating kafka progress:', error)
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

  private buildDataTypeInfoMessage(): string {
    const dataTypeEntries = Object.entries(this.healthAnswers)
    if (dataTypeEntries.length === 0) {
      return ''
    }

    // Calculate which data type is currently being processed
    const totalDataTypes = dataTypeEntries.length

    if (this.currentProgress >= 100) {
      // All data types completed
      return `<small><strong>Completed all data types</strong></small>`
    }

    // Estimate current data type based on progress
    // Each data type gets roughly equal share of the progress
    const progressPerDataType = 100 / totalDataTypes
    const currentIndex = Math.min(
      Math.floor(this.currentProgress / progressPerDataType),
      totalDataTypes - 1
    )

    // Calculate progress within the current data type
    const progressInCurrentType = (this.currentProgress % progressPerDataType) / progressPerDataType * 100

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

  private formatDataTypeName(dataType: string): string {
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

  private handleProgressError(error: any): void {
    console.error('Progress tracking error:', error)
    this.hasProcessingError = true
    this.statusMessage = 'Error tracking progress'
    this.progressMessage = 'Progress tracking failed'
    this.isDataProcessing = false
  }

  // Private success/error handling methods
  private handleProcessingSuccess(processingTimeout: NodeJS.Timeout): void {
    this.cleanupProcessingResources(processingTimeout)
    this.dataProcessingComplete = true
    this.isDataProcessing = false
    this.statusMessage = 'Health data processed successfully!'
    this.progressMessage = 'All data has been processed and uploaded'
    this.currentProgress = 100

    // Show completion alert after a brief delay to let user see the progress
    setTimeout(() => {
      this.showProcessingCompletionAlert()
    }, 1000)

    this.usage.sendGeneralEvent(UsageEventType.QUESTIONNAIRE_FINISHED)
  }

  private handleProcessingError(processingTimeout: NodeJS.Timeout, error: any): void {
    this.cleanupProcessingResources(processingTimeout)
    this.hasProcessingError = true
    this.isDataProcessing = false
    this.statusMessage = 'Error processing health data'
    this.progressMessage = 'Processing failed - you can retry or exit'

    console.error('Health data processing error:', error)

    // Show error alert after a brief delay
    setTimeout(() => {
      this.showProcessingErrorAlert(error)
    }, 500)

    this.usage.sendGeneralEvent(UsageEventType.QUESTIONNAIRE_CANCELLED)
  }

  private cleanupProcessingResources(processingTimeout: NodeJS.Timeout): void {
    clearTimeout(processingTimeout)
    this.kafkaProgressSubscription.unsubscribe()
  }

  // Private utility methods
  private resetProcessingState(): void {
    this.isDataProcessing = false
    this.dataProcessingComplete = false
    this.hasProcessingError = false
    this.currentProgress = 0
    this.progressMessage = ''
    this.statusMessage = 'Ready to process health data'

    // Reset timing variables
    this.uploadStartTime = 0
    this.lastProgressUpdate = 0

    this.healthAnswers = {}
    this.healthTimestamps = {}
  }

  private cleanup(): void {
    if (this.kafkaProgressSubscription) {
      this.kafkaProgressSubscription.unsubscribe()
    }

    // Reset timing variables
    this.uploadStartTime = 0
    this.lastProgressUpdate = 0

    // Clear health data cache on cleanup
    this.healthAnswers = {}
    this.healthTimestamps = {}
  }

  // Private error handling methods
  private handleHealthKitError(error: any): void {
    console.error('HealthKit error:', error)
    this.statusMessage = 'HealthKit not available on this device'
    this.showHealthKitErrorAlert()
  }

  private showHealthKitErrorAlert(): void {
    this.alertService.showAlert({
      header: 'HealthKit Not Available',
      message: 'HealthKit is not supported on this device or access has been denied. Please check your device settings.',
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => this.handleFinish()
        }
      ]
    })
  }

  private showProcessingErrorAlert(error: any): void {
    const errorMessage = error?.message || 'An unknown error occurred while processing health data.'

    this.alertService.showAlert({
      header: 'Processing Error',
      message: `Failed to process health data: ${errorMessage}`,
      buttons: [
        {
          text: 'Retry',
          handler: () => this.retryProcessing()
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => this.handleFinish()
        }
      ]
    })
  }

  private showProcessingCompletionAlert(): void {
    this.alertService.showAlert({
      header: 'Processing Complete',
      message: 'Your health data has been successfully processed and uploaded.',
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => this.handleFinish()
        }
      ]
    })
  }

  private showProcessingTimeoutDialog(): void {
    this.alertService.showAlert({
      header: 'Processing Timeout',
      message: 'Health data processing is taking longer than expected. Would you like to retry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => this.handleFinish()
        },
        {
          text: 'Retry',
          handler: () => this.retryProcessing()
        }
      ]
    })
  }

  // Public methods for accessing stored health data (for debugging/testing)
  getStoredHealthAnswers(): Record<string, any> {
    return { ...this.healthAnswers }
  }

  getStoredHealthTimestamps(): Record<string, number> {
    return { ...this.healthTimestamps }
  }

  exitQuestionnaire(): void {
    this.navCtrl.navigateRoot('/home')
  }

  // Getter methods for template
  get canStartProcessing(): boolean {
    return this.isHealthKitSupported &&
      !this.isDataProcessing &&
      !this.dataProcessingComplete &&
      !!this.task
  }

  get showRetryButton(): boolean {
    return this.hasProcessingError && !this.isDataProcessing
  }

  get showFinishButton(): boolean {
    return this.dataProcessingComplete || this.hasProcessingError
  }

  get showProgressBar(): boolean {
    return this.isDataProcessing || this.dataProcessingComplete
  }
}
