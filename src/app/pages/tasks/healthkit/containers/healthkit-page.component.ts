import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { Network } from '@capacitor/network'
import { NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { AlertService } from '../../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { UsageService } from '../../../../core/services/usage/usage.service'
import { ConfigService } from '../../../../core/services/config/config.service'
import { UsageEventType } from '../../../../shared/enums/events'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { HealthkitService, ProgressUpdate } from '../services/healthkit.service'
import { HealthQuestionnaireProcessorService } from '../services/health-questionnaire-processor.service'

enum ProcessingState {
  IDLE = 'idle',
  COLLECTING = 'collecting',
  PROCESSING = 'processing',
  UPLOADING = 'uploading',
  COMPLETE = 'complete',
  ERROR = 'error'
}

@Component({
  selector: 'page-healthkit',
  templateUrl: 'healthkit-page.component.html',
  styleUrls: ['healthkit-page.component.scss']
})
export class HealthkitPageComponent implements OnInit, OnDestroy {
  // Core state
  task: Task | null = null
  isHealthKitSupported = false
  processingState = ProcessingState.IDLE
  isNetworkConnected = true

  // Progress and retry state
  currentProgress: ProgressUpdate = { progress: 0, message: 'Ready', status: 'idle' }
  private retryAttemptCount = 0
  private progressBaseOffset = 0

  // Subscriptions
  private progressSubscription: Subscription = new Subscription()
  private kafkaProgressSubscription: Subscription = new Subscription()
  private processingTimeout: NodeJS.Timeout | null = null

  // Constants
  private readonly MAX_RETRY_ATTEMPTS = 5
  private readonly DATA_UPLOAD_TIMEOUT = 1_200_000 // 20 minutes

  private readonly RELOADED_CONFIG_KEY = 'RELOADED_CONFIG_KEY'

  constructor(
    public navCtrl: NavController,
    private usage: UsageService,
    private localization: LocalizationService,
    private router: Router,
    private alertService: AlertService,
    private configService: ConfigService,
    private healthkitService: HealthkitService,
    private healthProcessor: HealthQuestionnaireProcessorService
  ) {
    const navigation = this.router.getCurrentNavigation()
    if (navigation?.extras?.state) {
      this.task = navigation.extras.state as Task
    }
  }

  ngOnInit(): void {
    this.usage.setPage(this.constructor.name)
    this.initialize()
    // Check if page was reloaded using sessionStorage
    const wasReloaded = sessionStorage.getItem(this.RELOADED_CONFIG_KEY) === 'true'
    if (wasReloaded) {
      sessionStorage.removeItem(this.RELOADED_CONFIG_KEY)
      // Show error
      this.updateProgress({
        message: 'Please check your internet connection and retry',
        status: 'error'
      })
      this.handleError(new Error('Page was reloaded'))
    } else {
      // Set flag for next potential reload
      sessionStorage.setItem(this.RELOADED_CONFIG_KEY, 'true')
    }
  }

  ngOnDestroy(): void {
    this.cleanup()
    KeepAwake.allowSleep()
  }

  ionViewDidEnter(): void {
    KeepAwake.keepAwake()
    this.attemptAutoResumeUploadIfNeeded()
  }

  ionViewWillLeave(): void {
    this.cleanup()
    KeepAwake.allowSleep()
    sessionStorage.removeItem(this.RELOADED_CONFIG_KEY)
  }

  async startHealthDataCollection(): Promise<void> {
    // Reset base offset for fresh start
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_STARTED)
    this.progressBaseOffset = 0
    this.healthkitService.setProgressBaseOffset(0)
    await this.processHealthData(false)
  }

  retryProcessing(): void {
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_RETRY)
    this.processingState = ProcessingState.IDLE
    // Check network status
    Network.getStatus().then(status => this.updateNetworkStatus(status))
    this.processHealthData(true)
  }

  exitTask(): void {
    if (this.processingState === ProcessingState.COMPLETE) {
      this.healthkitService.resetProgress()
    }
    this.navCtrl.navigateRoot('/home')
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_EXIT)
  }

  // Private initialization
  private async initialize(): Promise<void> {
    await this.initializeHealthKitSupport()
    this.initializeNetworkMonitoring()
    this.subscribeToProgress()
  }

  private async initializeHealthKitSupport(): Promise<void> {
    try {
      await this.healthkitService.checkHealthkitSupported()
      this.isHealthKitSupported = true
      // Estimate percentage already sent from previous attempts
      try {
        const [total, unsent] = await Promise.all([
          this.healthkitService.getTotalHealthkitDataCount(),
          this.healthProcessor.getUnsentHealthkitCount()
        ])
        if (total > 0 && unsent >= 0 && unsent <= total) {
          const sent = total - unsent
          const overallPercent = Math.round(15 + (85 * (sent / total)))
          this.progressBaseOffset = Math.min(Math.max(overallPercent, 0), 99)
          this.healthkitService.setProgressBaseOffset(this.progressBaseOffset)
          this.handleKafkaProgress(0)
        }
      } catch { }
      this.updateProgress({
        message: 'We will collect your physical activity and related Apple Health data. Tap below to start.',
        status: 'ready'
      })
    } catch (error) {
      this.isHealthKitSupported = false
      this.updateProgress({
        message: 'HealthKit is not supported on this device',
        status: 'error'
      })
      console.error('HealthKit error:', error)
    }
  }

  private initializeNetworkMonitoring(): void {
    Network.getStatus().then(status => this.updateNetworkStatus(status))
    Network.addListener('networkStatusChange', status => this.updateNetworkStatus(status))
  }

  private subscribeToProgress(): void {
    this.progressSubscription = this.healthkitService.progress$.subscribe(
      progress => this.currentProgress = progress
    )
  }

  // Processing logic
  private async processHealthData(isRetry: boolean): Promise<void> {
    if (isRetry && !this.handleRetryLogic()) return

    if (!this.validateProcessingConditions()) return

    if (await this.tryResumeFromCache(isRetry)) return

    await this.performFullDataProcessing()
  }

  private validateProcessingConditions(): boolean {
    if (!this.isHealthKitSupported || !this.task) return false

    if (!this.isNetworkConnected) {
      this.handleError(new Error('Network connection lost'))
      return false
    }

    return true
  }

  private handleRetryLogic(): boolean {
    this.retryAttemptCount++

    if (this.retryAttemptCount > this.MAX_RETRY_ATTEMPTS) {
      this.showRetryAlert()
      return false
    }

    // Preserve progress for resume functionality
    this.progressBaseOffset = Math.min(Math.max(this.currentProgress.progress, 0), 99)
    // Set the base offset in the service so it can adjust all progress updates
    this.healthkitService.setProgressBaseOffset(this.progressBaseOffset)
    return true
  }

  private async tryResumeFromCache(isRetry: boolean): Promise<boolean> {
    try {
      const hasCache = await this.healthProcessor.hasHealthkitCache()
      const isUploadReady = await this.healthkitService.isUploadReady()

      if (hasCache && isUploadReady && this.processingState === ProcessingState.IDLE) {
        this.processingState = ProcessingState.PROCESSING
        // If this is a retry, set the base offset for cache upload too
        if (isRetry && this.progressBaseOffset > 0) {
          this.healthkitService.setProgressBaseOffset(this.progressBaseOffset)
        }
        this.updateProgress({
          message: 'Resuming upload of pending health data...',
          status: 'uploading'
        })
        await this.performCacheUploadOnly()
        return true
      }
    } catch (error) {
      console.warn('Failed to check cache, proceeding with normal flow', error)
    }

    return false
  }

  private async performFullDataProcessing(): Promise<void> {
    this.processingState = ProcessingState.COLLECTING
    this.startProcessingTimeout()
    this.setupKafkaProgressTracking()

    try {
      await this.healthProcessor.clearHealthkitCache()

      await new Promise(resolve => setTimeout(resolve, 5000))

      // Step 1: Collect health data
      const healthData = await this.healthkitService.collectHealthData(this.task!)

      // Step 2: Process the collected data
      const processedData = this.createHealthDataPayload(healthData)
      await this.healthProcessor.process(processedData, this.task!, {
        type: 'healthkit',
        timestamp: Date.now()
      })

      // Step 3: Verify upload completion
      await this.verifyUploadCompletion()

    } catch (error) {
      this.handleError(error)
    }
  }

  private async performCacheUploadOnly(): Promise<void> {
    this.processingState = ProcessingState.UPLOADING
    this.startProcessingTimeout()
    this.setupKafkaProgressTracking()

    try {
      await this.healthProcessor.sendAllFromCache()
      await this.verifyUploadCompletion()
      await this.healthkitService.setUploadReadyFlag(false)
    } catch (error) {
      this.handleError(error)
    }
  }

  private createHealthDataPayload(healthData: { answers: Record<string, any>, timestamps: Record<string, number> }) {
    return {
      answers: healthData.answers,
      timestamps: healthData.timestamps,
      time: this.task!.timestamp,
      timeCompleted: Date.now()
    }
  }

  private async verifyUploadCompletion(): Promise<void> {
    const hasHealthkitCache = await this.healthProcessor.hasHealthkitCache()

    if (hasHealthkitCache) {
      throw new Error('Some data failed to send')
    }

    this.handleSuccess()
  }

  // Progress and Kafka tracking
  private setupKafkaProgressTracking(): void {
    const kafkaService = this.configService.getKafkaService()
    this.kafkaProgressSubscription = kafkaService.eventCallback$.subscribe({
      next: (progress: number) => this.handleKafkaProgress(progress),
      error: (error) => this.handleError(error)
    })
  }

  private handleKafkaProgress(progress: number): void {
    if (!this.isNetworkConnected) {
      this.updateNetworkStatus({ connected: false, connectionType: 'none' })
      this.healthkitService.stopProgressMessages()
      return
    }
    this.healthkitService.stopProgressMessages()
    this.healthkitService.updateKafkaProgress(progress, this.progressBaseOffset)
  }

  private updateProgress(update: Partial<ProgressUpdate>): void {
    this.currentProgress = { ...this.currentProgress, ...update }
  }

  // Success and error handling
  private handleSuccess(): void {
    this.processingState = ProcessingState.COMPLETE
    this.updateProgress({
      progress: 100,
      message: 'All data has been processed and uploaded',
      status: 'complete'
    })
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_FINISHED)
    this.healthProcessor.updateTaskToComplete(this.task)
    this.cleanupProcessingResources()
  }

  private handleError(error: any): void {
    this.processingState = ProcessingState.ERROR

    const errorMessage = this.getErrorMessage()
    this.updateProgress({
      message: errorMessage,
      status: 'error'
    })
    console.error('Health data processing error:', error)
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_ERROR)
    this.cleanupProcessingResources()
  }

  private getErrorMessage(): string {
    if (!this.isNetworkConnected) {
      return 'Please check your internet connection and retry'
    }
    return 'Some of your data failed to send - please retry'
  }

  // Timeout and cleanup
  private startProcessingTimeout(): void {
    this.processingTimeout = setTimeout(() => {
      if (this.isProcessing) {
        this.showProcessingTimeoutDialog()
      }
    }, this.DATA_UPLOAD_TIMEOUT)
  }

  private cleanupProcessingResources(): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout)
      this.processingTimeout = null
    }

    this.kafkaProgressSubscription.unsubscribe()
    this.progressBaseOffset = 0
  }

  private cleanup(): void {
    this.progressSubscription.unsubscribe()
    this.kafkaProgressSubscription.unsubscribe()
    this.cleanupProcessingResources()
    this.healthkitService.cleanup()
    Network.removeAllListeners()
  }

  // Network monitoring
  private async updateNetworkStatus(status: { connected: boolean; connectionType: string }): Promise<void> {
    this.isNetworkConnected = status.connected
    const isUploadReady = await this.healthkitService.isUploadReady()

    // If data is not ready to be uploaded, continue
    if (!this.isNetworkConnected && !isUploadReady) {
      return
    }

    if (!this.isNetworkConnected && this.isProcessing) {
      this.updateProgress({
        message: 'Please check your internet connection and retry',
        status: 'error'
      })
      this.processingState = ProcessingState.ERROR
      this.healthProcessor.cancelUpload()
      this.handleError(new Error('Network connection lost'))
    }
  }

  // Auto-resume functionality
  private async attemptAutoResumeUploadIfNeeded(): Promise<void> {
    const isUploadReady = await this.healthkitService.isUploadReady()
    if (isUploadReady) {
      this.processHealthData(true)
    }
  }

  private showRetryAlert(): void {
    this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_TITLE),
      message: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_MESSAGE),
      buttons: [{
        text: 'Return to Home',
        handler: () => this.exitTask()
      }]
    })
  }

  private showProcessingTimeoutDialog(): void {
    this.alertService.showAlert({
      header: 'Processing Timeout',
      message: 'Health data processing is taking longer than expected. Please check your internet connection and try again later.',
      buttons: [{
        text: 'Return to Home',
        handler: () => this.exitTask()
      }]
    })
  }

  // Template getters
  get canStartProcessing(): boolean {
    return this.isHealthKitSupported &&
      this.isNetworkConnected &&
      this.processingState === ProcessingState.IDLE &&
      !!this.task
  }

  get showRetryButton(): boolean {
    return this.processingState === ProcessingState.ERROR
  }

  get showFinishButton(): boolean {
    return this.processingState === ProcessingState.COMPLETE ||
      this.processingState === ProcessingState.ERROR
  }

  get showProgressBar(): boolean {
    return this.processingState !== ProcessingState.IDLE
  }

  get isProcessing(): boolean {
    return [ProcessingState.COLLECTING, ProcessingState.PROCESSING, ProcessingState.UPLOADING]
      .includes(this.processingState as ProcessingState)
  }

  get statusMessage(): string {
    switch (this.processingState) {
      case ProcessingState.COLLECTING:
        return 'Collecting health data...'
      case ProcessingState.PROCESSING:
        return 'Processing and uploading data...'
      case ProcessingState.UPLOADING:
        return 'Uploading data...'
      case ProcessingState.COMPLETE:
        return 'Health data processed successfully!'
      case ProcessingState.ERROR:
        return this.getErrorStatusMessage()
      default:
        return this.isHealthKitSupported
          ? 'Ready to collect health data'
          : 'Checking HealthKit support...'
    }
  }

  private getErrorStatusMessage(): string {
    if (!this.isNetworkConnected) {
      return 'Network connection lost during upload'
    }
    return 'There was a problem connecting to the server'
  }

  get networkStatusInfo(): string {
    if (!this.isNetworkConnected) {
      return 'No internet connection'
    }
    return 'Connected'
  }
}
