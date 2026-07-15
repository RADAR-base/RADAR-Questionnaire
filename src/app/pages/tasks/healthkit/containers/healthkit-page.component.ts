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
import { AttemptProgress, HealthkitService, ProgressUpdate } from '../services/healthkit.service'
import { HealthQuestionnaireProcessorService } from '../services/health-questionnaire-processor.service'
import { DefaultHealthkitPullTimeout } from 'src/assets/data/defaultConfig'

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
  attemptProgress: AttemptProgress = { success: 0, failed: 0, cacheSize: 0 }
  private retryAttemptCount = 0
  private progressBaseOffset = 0

  // Subscriptions
  private progressSubscription: Subscription = new Subscription()
  private kafkaProgressSubscription: Subscription = new Subscription()
  private processingTimeout: NodeJS.Timeout | null = null

  // Constants
  private readonly MAX_RETRY_ATTEMPTS = 5
  private readonly DATA_UPLOAD_TIMEOUT = DefaultHealthkitPullTimeout

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
  }

  async startHealthDataCollection(): Promise<void> {
    // Reset base offset for fresh start
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_STARTED, true)
    this.progressBaseOffset = 0
    this.healthkitService.setProgressBaseOffset(0)
    await this.processHealthData(false)
  }

  retryProcessing(): void {
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_RETRY, true)
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
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_EXIT, true)
  }

  skipTask(): void {
    this.healthProcessor.updateTaskToComplete(this.task)
    this.navCtrl.navigateRoot('/home')
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_EXIT, true)
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
        await this.initializeProgressOffset()
      } catch { }
      this.updateProgress({
        message: this.localization.translateKey(LocKeys.HEALTHKIT_READY_DESC),
        status: 'ready'
      })
    } catch (error) {
      this.isHealthKitSupported = false
      this.updateProgress({
        message: this.localization.translateKey(LocKeys.HEALTHKIT_NOT_SUPPORTED),
        status: 'error'
      })
      console.error('HealthKit error:', error)
    }
  }

  private async initializeProgressOffset(): Promise<void> {
    const [total, unsent] = await Promise.all([
      this.healthkitService.getTotalHealthkitDataCount(),
      this.healthProcessor.getUnsentHealthkitCount()
    ])
    if (total > 0 && unsent >= 0 && unsent <= total) {
      const sent = total - unsent
      const overallPercent = Math.round(15 + (85 * (sent / total)))
      this.progressBaseOffset = Math.min(Math.max(overallPercent, 0), 99)
      this.healthkitService.setProgressBaseOffset(this.progressBaseOffset)
      this.handleKafkaProgress(0, 0, total, unsent)
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
      const isUploadReady = await this.healthkitService.isUploadReady()

      if (isUploadReady && this.processingState === ProcessingState.IDLE) {
        this.processingState = ProcessingState.PROCESSING
        // If this is a retry, set the base offset for cache upload too
        if (isRetry && this.progressBaseOffset > 0) {
          this.healthkitService.setProgressBaseOffset(this.progressBaseOffset)
        }
        this.updateProgress({
          message: this.localization.translateKey(LocKeys.HEALTHKIT_RESUMING),
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
      await this.initializeProgressOffset()
      throw new Error('Some data failed to send')
    }

    this.handleSuccess()
  }

  // Progress and Kafka tracking
  private setupKafkaProgressTracking(): void {
    const kafkaService = this.configService.getKafkaService()
    this.kafkaProgressSubscription = kafkaService.eventCallback$.subscribe({
      next: ({ success, failed, cacheSize }) => this.handleKafkaProgress(success, failed, cacheSize, cacheSize),
      error: (error) => this.handleError(error)
    })
  }

  private handleKafkaProgress(success: number, failed: number, totalData: number, cacheSize: number): void {
    const normalizedProgress = Math.min(Math.max(success / totalData, 0), 1)
    if (!this.isNetworkConnected) {
      this.updateNetworkStatus({ connected: false, connectionType: 'none' })
      this.healthkitService.stopProgressMessages()
      return
    }
    this.attemptProgress = { success, failed, cacheSize }
    this.healthkitService.updateKafkaProgress(normalizedProgress, this.progressBaseOffset)
  }

  private updateProgress(update: Partial<ProgressUpdate>): void {
    this.currentProgress = { ...this.currentProgress, ...update }
  }

  // Success and error handling
  private handleSuccess(): void {
    this.processingState = ProcessingState.COMPLETE
    this.updateProgress({
      progress: 100,
      message: this.localization.translateKey(LocKeys.HEALTHKIT_COMPLETE),
      status: 'complete'
    })
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_FINISHED, true)
    this.healthProcessor.updateTaskToComplete(this.task)
    this.cleanupProcessingResources()
  }

  private handleError(error: any): void {
    this.processingState = ProcessingState.ERROR

    const errorMessage = this.getErrorMessage(this.attemptProgress.failed)
    this.updateProgress({
      message: errorMessage,
      status: 'error'
    })
    console.error('Health data processing error:', error)
    this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_ERROR, true, { error: error })
    this.cleanupProcessingResources()
  }

  private getErrorMessage(failCount: number): string {
    if (!this.isNetworkConnected) {
      return this.localization.translateKey(LocKeys.HEALTHKIT_CHECK_CONNECTION)
    }
    return ''
  }

  // Timeout and cleanup
  private startProcessingTimeout(): void {
    this.processingTimeout = setTimeout(() => {
      if (this.isProcessing) {
        this.usage.sendGeneralEvent(UsageEventType.HEALTHKIT_TIMEOUT, true)
        this.updateProgress({
          message: this.localization.translateKey(LocKeys.HEALTHKIT_TIMEOUT_MSG),
          status: 'error'
        })
        this.processingState = ProcessingState.ERROR
        this.healthProcessor.cancelUpload()
        this.handleError(new Error('Processing timeout'))
        this.showProcessingTimeoutDialog()
      }
    }, this.DATA_UPLOAD_TIMEOUT)
  }

  private cleanupProcessingResources(): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout)
      this.processingTimeout = null
    }
    this.healthkitService.stopProgressMessages()
    this.kafkaProgressSubscription.unsubscribe()
    this.progressBaseOffset = 0
    this.attemptProgress = { success: 0, failed: 0, cacheSize: 0 }
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
        message: this.localization.translateKey(LocKeys.HEALTHKIT_CHECK_CONNECTION),
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
        text: this.localization.translateKey(LocKeys.HEALTHKIT_RETURN_HOME),
        handler: () => this.exitTask()
      }],
      backdropDismiss: false
    })
  }

  private showProcessingTimeoutDialog(): void {
    this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.HEALTHKIT_TIMEOUT_TITLE),
      message: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_MESSAGE),
      buttons: [{
        text: this.localization.translateKey(LocKeys.HEALTHKIT_RETURN_HOME),
        handler: () => this.exitTask()
      }],
      backdropDismiss: false
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
    return this.processingState === ProcessingState.COMPLETE
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
        return this.localization.translateKey(LocKeys.HEALTHKIT_COLLECTING)
      case ProcessingState.PROCESSING:
        return this.localization.translateKey(LocKeys.HEALTHKIT_PROCESSING_UPLOADING)
      case ProcessingState.UPLOADING:
        return this.localization.translateKey(LocKeys.HEALTHKIT_UPLOADING)
      case ProcessingState.COMPLETE:
        return this.localization.translateKey(LocKeys.HEALTHKIT_SUCCESS)
      case ProcessingState.ERROR:
        return ''
      default:
        if (!this.isHealthKitSupported) {
          return this.localization.translateKey(LocKeys.HEALTHKIT_NOT_AVAILABLE)
        }
        return this.localization.translateKey(LocKeys.HEALTHKIT_READY)
    }
  }

  get showSkipButton(): boolean {
    return !this.isHealthKitSupported && this.processingState === ProcessingState.IDLE
  }

  private getErrorStatusMessage(): string {
    if (!this.isNetworkConnected) {
      return this.localization.translateKey(LocKeys.HEALTHKIT_CHECK_CONNECTION)
    }
    return this.localization.translateKey(LocKeys.HEALTHKIT_SERVER_ERROR)
  }

  get attemptStatusText(): string {
    const sent = this.attemptProgress.success + this.attemptProgress.failed
    return `${sent}/${this.attemptProgress.cacheSize}`
  }

  get networkStatusInfo(): string {
    if (!this.isNetworkConnected) {
      return this.localization.translateKey(LocKeys.HEALTHKIT_NO_CONNECTION)
    }
    return this.localization.translateKey(LocKeys.HEALTHKIT_CONNECTED)
  }
}
