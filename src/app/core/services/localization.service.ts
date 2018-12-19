import 'moment/locale/da'
import 'moment/locale/de'
import 'moment/locale/es'
import 'moment/locale/it'
import 'moment/locale/nl'

import { Injectable } from '@angular/core'
import moment = require('moment')

import { Localisations } from '../../../assets/data/localisations'
import { LocKeys } from '../../shared/enums/localisations'
import { StorageKeys } from '../../shared/enums/storage'
import { MultiLanguageText } from '../../shared/models/text'
import { StorageService } from './storage.service'

const DEFAULT_LANG = 'en'

@Injectable()
export class LocalizationService {
  preferredLang?: string
  localeMoment: moment.Moment

  constructor(private storage: StorageService) {
    this.update()
  }

  update() {
    return this.storage.get(StorageKeys.LANGUAGE)
      .then(language => {
        this.preferredLang = language ? language.value : DEFAULT_LANG
        this.localeMoment = moment().locale(this.preferredLang)
      })
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
    let translation = loc[this.preferredLang]
    if (translation !== undefined) {
      return translation
    }
    translation = loc['default']
    if (translation !== undefined) {
      console.log('Using fallback language "default" for message ' + defaultValue)
      return translation
    }
    const keys = Object.keys(loc)
    if (keys.length > 0) {
      const lang = keys[0]
      console.log('Using fallback language "' + lang + '" for message ' + defaultValue)
      return loc[lang]
    } else {
      console.log('Missing localization ' + defaultValue)
      return defaultValue
    }
  }

  moment(time?: number | Date) {
    if (time !== undefined) {
      return moment(time).locale(this.preferredLang)
    } else {
      return moment(this.localeMoment)
    }
  }
}
