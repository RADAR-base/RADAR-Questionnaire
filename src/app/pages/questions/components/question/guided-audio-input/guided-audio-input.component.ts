import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core'
import { NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { DefaultMaxAudioAttemptsAllowed } from '../../../../../../assets/data/defaultConfig'
import { LocalizationService } from '../../../../../core/services/misc/localization.service'
import { TextToSpeechService } from '../../../../../core/services/misc/text-to-speech.service'
import { AlertService } from '../../../../../core/services/misc/alert.service'
import { UsageService } from '../../../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../../../shared/enums/events'
import { LocKeys } from '../../../../../shared/enums/localisations'
import { TranslatePipe } from '../../../../../shared/pipes/translate/translate'
import { AudioRecordService } from '../../../services/audio-record.service'
import { GuidedAudioAnnotation } from '../../../../../shared/models/question'

export type GuidedAudioState =
  | 'idle'
  | 'speaking'
  | 'recording'
  | 'recorded'

@Component({
  selector: 'guided-audio-input',
  templateUrl: 'guided-audio-input.component.html',
  styleUrls: ['guided-audio-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuidedAudioInputComponent implements OnInit, OnChanges, OnDestroy {
  private readonly AUTO_TTS_START_DELAY_MS = 1000
  @Input() text: string
  @Input() image: string
  @Input() config: GuidedAudioAnnotation = {}
  @Input() currentlyShown: boolean
  @Input() maxAttempts: number = DefaultMaxAudioAttemptsAllowed

  @Output() valueChange = new EventEmitter<any>()
  @Output() onRecordStart = new EventEmitter<boolean>()

  state: GuidedAudioState = 'idle'
  recordSecondsRemaining: number = 0
  recordAttempts: number = 0
  hasReplayedPrompt: boolean = false

  get shouldHideFieldLabel(): boolean {
    return this.config?.hide_field_label === true
  }

  get shouldShowFieldLabel(): boolean {
    return !this.shouldHideFieldLabel && !!this.text?.trim()
  }

  get shouldShowPromptRow(): boolean {
    return this.shouldShowFieldLabel || !!this.config?.allow_replay_prompt
  }

  get shouldAllowManualStart(): boolean {
    return !this.isAutoRecordEnabled
  }

  private get isAutoRecordEnabled(): boolean {
    const val: unknown = this.config?.auto_record_after_tts
    return val === true || val === 'true' || val === 1
  }

  private recordingTimer: ReturnType<typeof setInterval>
  private autoTtsDelayTimer: ReturnType<typeof setTimeout>
  private promptAudioEl: HTMLAudioElement | undefined
  private pauseListener: Subscription
  private backButtonListener: Subscription
  private isDestroyed = false

  constructor(
    private audioRecordService: AudioRecordService,
    private textToSpeechService: TextToSpeechService,
    private localization: LocalizationService,
    private alertService: AlertService,
    private platform: Platform,
    private navCtrl: NavController,
    private translate: TranslatePipe,
    private usage: UsageService,
    private ref: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.pauseListener = this.platform.pause.subscribe(() => {
      if (this.state === 'recording') {
        this.doStopRecording()
        this.showInterruptedAlert()
      }
    })
    this.backButtonListener = this.platform.backButton.subscribe(() => {
      this.cleanup()
      navigator['app'].exitApp()
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentlyShown']) {
      const prev = changes['currentlyShown'].previousValue
      const curr = changes['currentlyShown'].currentValue
      if (curr && !prev) this.onBecameVisible()
      if (!curr && prev) this.onBecameHidden()
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true
    this.cleanup()
    this.pauseListener?.unsubscribe()
    this.backButtonListener?.unsubscribe()
  }

  // ─── Lifecycle helpers ──────────────────────────────────────────────────────

  private onBecameVisible() {
    this.state = 'idle'
    const shouldAutoPlayPrompt = !!this.config?.prompt_audio_src || !!this.config?.auto_tts
    if (shouldAutoPlayPrompt) {
      const delayMs = this.config?.prompt_start_delay_ms ?? this.AUTO_TTS_START_DELAY_MS
      this.autoTtsDelayTimer = setTimeout(
        () => !this.isDestroyed && this.playPrompt(),
        delayMs
      )
      return
    }

    // Allow auto-recording even when TTS is disabled.
    if (this.isAutoRecordEnabled) {
      this.doStartRecording()
    }
  }

  private onBecameHidden() {
    this.cleanup()
  }

  // ─── TTS ────────────────────────────────────────────────────────────────────

  private async playPrompt() {
    // Wait for any in-progress TTS (e.g. auto-read-aloud) to finish first
    await this.textToSpeechService.waitForCompletion()
    if (this.isDestroyed || !this.currentlyShown) return
    if (this.config?.prompt_audio_src) {
      this.playPromptAudio(this.config.prompt_audio_src)
      return
    }
    this.speakPrompt()
  }

  private speakPrompt() {
    if (!this.text?.trim()) {
      this.onTtsDone()
      return
    }
    this.state = 'speaking'
    this.ref.markForCheck()
    const lang = this.localization.getLanguage()?.value
    this.textToSpeechService.speak(this.text, lang).then(() => this.onTtsDone())
  }

  private onTtsDone() {
    if (this.isDestroyed || this.state !== 'speaking') return
    if (this.isAutoRecordEnabled) {
      this.doStartRecording()
    } else {
      this.state = 'idle'
      this.ref.markForCheck()
    }
  }

  replayPrompt() {
    if (this.hasReplayedPrompt) return
    this.hasReplayedPrompt = true
    this.playPrompt()
  }

  // ─── Recording ──────────────────────────────────────────────────────────────

  /** Called from the "Start recording" button in idle state. */
  startRecording() {
    if (!this.shouldAllowManualStart) return
    this.doStartRecording()
  }

  private doStartRecording() {
    if (this.recordAttempts >= this.maxAttempts) return
    this.recordAttempts++
    this.state = 'recording'
    this.onRecordStart.emit(true)
    this.ref.markForCheck()

    this.audioRecordService.startAudioRecording().catch(() => {
      if (!this.isDestroyed) this.showInterruptedAlert()
    })

    const duration = this.config?.record_seconds ?? 0
    if (duration > 0) {
      this.recordSecondsRemaining = duration
      this.recordingTimer = setInterval(() => {
        this.recordSecondsRemaining--
        this.ref.markForCheck()
        if (this.recordSecondsRemaining <= 0) {
          clearInterval(this.recordingTimer)
          this.doStopRecording()
        }
      }, 1000)
    }

    this.usage.sendGeneralEvent(UsageEventType.RECORDING_STARTED, true)
  }

  /** Called from the "Stop recording" button or timer expiry. */
  handleManualStop() {
    this.doStopRecording()
  }

  private doStopRecording() {
    clearInterval(this.recordingTimer)
    this.onRecordStart.emit(false)
    this.usage.sendGeneralEvent(UsageEventType.RECORDING_STOPPED, true)
    this.audioRecordService
      .stopAudioRecording()
      .then(() => {
        if (this.isDestroyed) return
        this.state = 'recorded'
        this.ref.markForCheck()
        this.confirmRecording()
      })
      .catch(() => {
        if (!this.isDestroyed) this.showInterruptedAlert()
      })
  }

  private confirmRecording() {
    this.valueChange.emit(this.audioRecordService.getFormattedAudioData())
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────

  private cleanup() {
    this.stopPromptPlayback()
    clearTimeout(this.autoTtsDelayTimer)
    clearInterval(this.recordingTimer)
    if (this.audioRecordService.getIsRecording()) {
      this.audioRecordService.stopAudioRecording().catch(() => { })
    }
    this.onRecordStart.emit(false)
  }

  private playPromptAudio(src: string) {
    this.stopPromptPlayback()
    this.state = 'speaking'
    this.ref.markForCheck()

    this.promptAudioEl = new Audio(src)
    this.promptAudioEl.onended = () => this.onTtsDone()
    this.promptAudioEl.onerror = () => this.onTtsDone()
    void this.promptAudioEl.play().catch(() => this.onTtsDone())
  }

  private stopPromptPlayback() {
    this.textToSpeechService.stop()
    if (this.promptAudioEl) {
      this.promptAudioEl.pause()
      this.promptAudioEl.currentTime = 0
      this.promptAudioEl.onended = null
      this.promptAudioEl.onerror = null
      this.promptAudioEl = undefined
    }
  }

  private showInterruptedAlert() {
    this.usage.sendGeneralEvent(UsageEventType.RECORDING_ERROR)
    this.alertService.showAlert({
      header: this.translate.transform(LocKeys.AUDIO_TASK_ALERT.toString()),
      message: this.translate.transform(
        LocKeys.AUDIO_TASK_ALERT_DESC.toString()
      ),
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {
            this.navCtrl.navigateRoot('')
          }
        }
      ],
      backdropDismiss: false
    })
  }
}
