// tslint:disable:no-duplicate-imports
import { Injectable } from '@angular/core'
import { Moment } from 'moment'
import * as moment from 'moment'
import * as localeDA from 'moment/locale/da'
import * as localeDE from 'moment/locale/de'
import * as localeES from 'moment/locale/es'
import * as localeIT from 'moment/locale/it'
import * as localeNL from 'moment/locale/nl'

import { DefaultSettingsSupportedLanguages } from '../../../../assets/data/defaultConfig'
import { Localisations } from '../../../../assets/data/localisations'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import { LanguageSetting } from '../../../shared/models/settings'
import { MultiLanguageText } from '../../../shared/models/text'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class LocalizationService {
  private readonly LOCALIZATION_STORAGE = {
    LANGUAGE: StorageKeys.LANGUAGE,
    SETTINGS_LANGUAGES: StorageKeys.SETTINGS_LANGUAGES
  }

  readonly defaultLanguage: LanguageSetting = {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  }

  private language: LanguageSetting = { ...this.defaultLanguage }
  private localeMoment: moment.Moment

  constructor(private storage: StorageService) {
    this.localeMoment = moment()
    this.update()
    this.updateLanguageSettings()
  }

  init() {
    return Promise.all([
      this.setLanguageSettings(DefaultSettingsSupportedLanguages),
      this.setLanguage(this.language)
    ])
  }

  update(): Promise<LanguageSetting> {
    return this.storage
      .get(this.LOCALIZATION_STORAGE.LANGUAGE)
      .then(language => this.updateLanguage(language))
  }

  setLanguage(language: LanguageSetting): Promise<LanguageSetting> {
    return this.storage
      .set(this.LOCALIZATION_STORAGE.LANGUAGE, language)
      .then(() => this.updateLanguage(language))
  }

  getLanguage(): LanguageSetting {
    return this.language
  }

  updateLanguageSettings(): Promise<any> {
    return this.getLanguageSettings().then(languages =>
      languages && languages.length == DefaultSettingsSupportedLanguages.length
        ? []
        : this.setLanguageSettings(DefaultSettingsSupportedLanguages)
    )
  }

  setLanguageSettings(settings) {
    return this.storage.set(
      this.LOCALIZATION_STORAGE.SETTINGS_LANGUAGES,
      settings
    )
  }

  getLanguageSettings() {
    return this.storage.get(this.LOCALIZATION_STORAGE.SETTINGS_LANGUAGES)
  }

  private updateLanguage(language: LanguageSetting) {
    this.language = language ? language : { ...this.defaultLanguage }
    this.localeMoment = moment().locale(this.language.value)
    moment.locale(this.language.value)
    return this.language
  }

  translateKey(locKey: LocKeys) {
    return this.translate(locKey.toString())
  }

  translate(value: string) {
    const loc = Localisations[value]
    if (!loc) {
      console.log('Missing localization ' + value)
      return value
    }
    return this.chooseText(loc, value)
  }

  chooseText(loc: MultiLanguageText, defaultValue?: string) {
    let translation = loc[this.language.value]
    if (translation !== undefined) {
      return translation
    }
    translation = loc['default']
    if (translation !== undefined) {
      console.log(
        'Using fallback language "default" for message ' + defaultValue
      )
      return translation
    }
    const keys = Object.keys(loc)
    if (keys.length > 0) {
      const lang = keys[0]
      console.log(
        'Using fallback language "' + lang + '" for message ' + defaultValue
      )
      return loc[lang]
    } else {
      console.log('Missing localization ' + defaultValue)
      return defaultValue
    }
  }

  moment(
    time?: moment.MomentInput,
    format?: moment.MomentFormatSpecification,
    strict?: boolean
  ): Moment {
    if (time !== undefined) {
      return moment(time, format, strict).locale(this.language.value)
    } else {
      return moment(this.localeMoment)
    }
  }
}
