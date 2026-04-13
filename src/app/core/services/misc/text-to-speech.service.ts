import { Injectable } from '@angular/core'

import { ConfigKeys } from '../../../shared/enums/config'
import { RemoteConfigService } from '../config/remote-config.service'

type TtsProvider = 'browser'

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private utterance: SpeechSynthesisUtterance | undefined
  private isSpeaking = false
  private readonly providerKey = new ConfigKeys('text_to_speech_provider')
  private readonly enabledKey = new ConfigKeys('text_to_speech_enabled')

  constructor(private remoteConfig: RemoteConfigService) { }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getSpeakingState(): boolean {
    return this.isSpeaking
  }

  /** True when the configured provider is available. */
  async isReadAloudAvailable(): Promise<boolean> {
    const isEnabled = await this.isFeatureEnabled()
    if (!isEnabled) return false

    const provider = await this.getProvider()
    if (provider === 'browser') return this.isSupported()
    return false
  }

  async speak(text: string, lang?: string): Promise<void> {
    if (!text?.trim()) return Promise.resolve()
    const isEnabled = await this.isFeatureEnabled()
    if (!isEnabled) return Promise.resolve()

    this.stop()

    const provider = await this.getProvider()
    if (provider === 'browser') return this.speakBrowser(text, lang)
    return Promise.resolve()
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    this.utterance = undefined
    this.isSpeaking = false
  }

  private async getProvider(): Promise<TtsProvider> {
    // Uses a free-form key so provider switching can be remote-configured later.
    const conf = await this.remoteConfig.read()
    const provider = (await conf.getOrDefault(this.providerKey, 'browser')).trim().toLowerCase()

    return provider === 'browser' ? 'browser' : 'browser'
  }

  private async isFeatureEnabled(): Promise<boolean> {
    const conf = await this.remoteConfig.read()
    const enabled = (await conf.getOrDefault(this.enabledKey, 'true')).trim().toLowerCase()
    return enabled !== 'false' && enabled !== '0' && enabled !== 'no'
  }

  private speakBrowser(text: string, lang?: string): Promise<void> {
    if (!this.isSupported()) return Promise.resolve()

    this.utterance = new SpeechSynthesisUtterance(text)
    if (lang) this.utterance.lang = lang
    this.isSpeaking = true

    return new Promise(resolve => {
      this.utterance.onend = () => {
        this.isSpeaking = false
        this.utterance = undefined
        resolve()
      }
      this.utterance.onerror = () => {
        this.isSpeaking = false
        this.utterance = undefined
        resolve()
      }
      window.speechSynthesis.speak(this.utterance)
    })
  }
}
