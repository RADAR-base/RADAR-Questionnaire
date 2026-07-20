import { Injectable } from '@angular/core'
import { Capacitor } from '@capacitor/core'
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
    return Capacitor.isNativePlatform()
  }

  getSpeakingState(): boolean {
    return this.isSpeaking
  }

  async isReadAloudAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false
    const isEnabled = await this.isFeatureEnabled()
    return isEnabled
  }

  async speak(text: string, lang?: string): Promise<void> {
    if (!this.isSupported()) return
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
        pitch: 1.0,
        voice
      })
    } catch (e) {
      // speech was stopped or failed
    } finally {
      this.isSpeaking = false
    }
  }

  stop() {
    if (!this.isSupported()) return
    TextToSpeech.stop().catch(() => { })
    this.isSpeaking = false
  }

  private async pickBestVoice(lang: string): Promise<number | undefined> {
    if (this.cachedVoice !== undefined) return this.cachedVoice

    try {
      const { voices } = await TextToSpeech.getSupportedVoices()
      if (!voices?.length) return undefined

      const langPrefix = lang.toLowerCase().split('-')[0]

      const isCompact = (v: { voiceURI?: string, name?: string }) =>
        v.voiceURI?.toLowerCase().includes('compact') ||
        v.name?.toLowerCase().includes('compact')

      // Novelty and robotic voices that should never be selected
      const isNoveltyOrRobotic = (v: { voiceURI?: string }) => {
        const uri = v.voiceURI?.toLowerCase() || ''
        return uri.includes('speech.synthesis.voice') || uri.includes('eloquence')
      }

      const isSiri = (v: { voiceURI?: string, name?: string }) =>
        v.voiceURI?.toLowerCase().includes('siri') ||
        v.name?.toLowerCase().includes('siri')

      const langVoices = voices.filter(v => v.lang?.toLowerCase().startsWith(langPrefix))

      console.log('[TTS] Available voices for "' + langPrefix + '":', langVoices.map(v => ({
        idx: voices.indexOf(v),
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        compact: isCompact(v),
        novelty: isNoveltyOrRobotic(v)
      })))

      const qualityKeywords = ['enhanced', 'premium', 'neural', 'natural']
      const preferredNames = ['samantha', 'karen', 'daniel', 'nicky', 'aaron']

      // Prefer en-GB, then exact locale, then any locale for the language
      const exactLocale = lang.toLowerCase()
      const preferredLocale = langPrefix === 'en' ? 'en-gb' : exactLocale

      const findVoice = (matchFn: (v: { name: string, voiceURI: string }) => boolean, excludeCompact: boolean, locale?: string) =>
        voices.findIndex(v =>
          (locale
            ? v.lang?.toLowerCase() === locale
            : v.lang?.toLowerCase().startsWith(langPrefix)) &&
          !isNoveltyOrRobotic(v) &&
          (!excludeCompact || !isCompact(v)) &&
          matchFn(v)
        )

      // Helper: try preferred locale (en-GB for English), then any locale for the language
      const findVoiceWithLocalePref = (matchFn: (v: { name: string, voiceURI: string }) => boolean, excludeCompact: boolean) => {
        if (preferredLocale.includes('-')) {
          const idx = findVoice(matchFn, excludeCompact, preferredLocale)
          if (idx >= 0) return idx
        }
        return findVoice(matchFn, excludeCompact)
      }

      const selectVoice = (label: string, idx: number) => {
        console.log('[TTS] Selected voice (' + label + '):', voices[idx].name, voices[idx].voiceURI)
        this.cachedVoice = idx
        return this.cachedVoice
      }

      // 1. Enhanced/neural voices (iOS)
      for (const keyword of qualityKeywords) {
        const idx = findVoiceWithLocalePref(v =>
          v.name?.toLowerCase().includes(keyword) ||
          v.voiceURI?.toLowerCase().includes(keyword),
          true
        )
        if (idx >= 0) return selectVoice('enhanced', idx)
      }

      // 2. Android network voices (cloud, highest quality)
      const networkIdx = findVoiceWithLocalePref(
        v => v.voiceURI?.toLowerCase().endsWith('-network'), false
      )
      if (networkIdx >= 0) return selectVoice('network', networkIdx)

      // 3. Siri voices (iOS) — prefer non-compact, fall back to compact
      for (const excludeCompact of [true, false]) {
        const idx = findVoiceWithLocalePref(v => isSiri(v), excludeCompact)
        if (idx >= 0) return selectVoice('siri', idx)
      }

      // 4. Android local voices (downloaded, good quality offline)
      const localIdx = findVoiceWithLocalePref(
        v => v.voiceURI?.toLowerCase().endsWith('-local'), false
      )
      if (localIdx >= 0) return selectVoice('local', localIdx)

      // 5. Known iOS voices — prefer non-compact, fall back to compact
      for (const excludeCompact of [true, false]) {
        for (const name of preferredNames) {
          const idx = findVoiceWithLocalePref(v => v.name?.toLowerCase() === name, excludeCompact)
          if (idx >= 0) return selectVoice('named', idx)
        }
      }

      // 6. Any non-novelty voice for this language
      const fallbackIdx = findVoiceWithLocalePref(() => true, false)
      if (fallbackIdx >= 0) return selectVoice('fallback', fallbackIdx)

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
