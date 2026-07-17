import { Injectable } from '@angular/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

import { ConfigKeys } from '../../../shared/enums/config'
import { RemoteConfigService } from '../config/remote-config.service'

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private isSpeaking = false
  private cachedVoice: number | undefined
  private readonly enabledKey = new ConfigKeys('text_to_speech_enabled')

  constructor(private remoteConfig: RemoteConfigService) { }

  isSupported(): boolean {
    return true
  }

  getSpeakingState(): boolean {
    return this.isSpeaking
  }

  async isReadAloudAvailable(): Promise<boolean> {
    const isEnabled = await this.isFeatureEnabled()
    return isEnabled
  }

  async speak(text: string, lang?: string): Promise<void> {
    if (!text?.trim()) return
    const isEnabled = await this.isFeatureEnabled()
    if (!isEnabled) return

    this.stop()
    this.isSpeaking = true

    try {
      const voice = await this.pickBestVoice(lang || 'en')
      await TextToSpeech.speak({
        text,
        lang: lang || 'en-US',
        rate: 0.6,
        pitch: 0.8,
        voice
      })
    } catch (e) {
      // speech was stopped or failed
    } finally {
      this.isSpeaking = false
    }
  }

  stop() {
    TextToSpeech.stop().catch(() => { })
    this.isSpeaking = false
  }

  private async pickBestVoice(lang: string): Promise<number | undefined> {
    if (this.cachedVoice !== undefined) return this.cachedVoice

    try {
      const { voices } = await TextToSpeech.getSupportedVoices()
      if (!voices?.length) return undefined

      const langPrefix = lang.toLowerCase().split('-')[0]
      const langVoices = voices.filter(v => v.lang?.toLowerCase().startsWith(langPrefix))

      console.log('[TTS] Available voices for "' + langPrefix + '":', langVoices.map((v, i) => ({
        idx: voices.indexOf(v),
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI
      })))

      // Prefer higher-quality voices by checking both name and voiceURI
      const qualityKeywords = ['enhanced', 'premium', 'neural', 'natural']
      const siriKeywords = ['siri']
      const preferredNames = ['samantha', 'karen', 'daniel', 'nicky', 'aaron']

      const findVoice = (matchFn: (v: { name: string, voiceURI: string }) => boolean) =>
        voices.findIndex(v =>
          v.lang?.toLowerCase().startsWith(langPrefix) && matchFn(v)
        )

      // 1. Enhanced/neural voices (best quality)
      for (const keyword of qualityKeywords) {
        const idx = findVoice(v =>
          v.name?.toLowerCase().includes(keyword) ||
          v.voiceURI?.toLowerCase().includes(keyword)
        )
        if (idx >= 0) {
          console.log('[TTS] Selected voice:', voices[idx].name, 'at index', idx)
          this.cachedVoice = idx
          return this.cachedVoice
        }
      }

      // 2. Siri voices (good quality)
      for (const keyword of siriKeywords) {
        const idx = findVoice(v =>
          v.name?.toLowerCase().includes(keyword) ||
          v.voiceURI?.toLowerCase().includes(keyword)
        )
        if (idx >= 0) {
          console.log('[TTS] Selected voice:', voices[idx].name, 'at index', idx)
          this.cachedVoice = idx
          return this.cachedVoice
        }
      }

      // 3. Known natural-sounding voices by name
      for (const name of preferredNames) {
        const idx = findVoice(v => v.name?.toLowerCase() === name)
        if (idx >= 0) {
          console.log('[TTS] Selected voice:', voices[idx].name, 'at index', idx)
          this.cachedVoice = idx
          return this.cachedVoice
        }
      }

      console.log('[TTS] No quality voice found, using default')
    } catch (e) {
      console.log('[TTS] getSupportedVoices error:', e)
    }

    return undefined
  }

  private async isFeatureEnabled(): Promise<boolean> {
    const conf = await this.remoteConfig.read()
    const enabled = (await conf.getOrDefault(this.enabledKey, 'true')).trim().toLowerCase()
    return enabled !== 'false' && enabled !== '0' && enabled !== 'no'
  }
}
