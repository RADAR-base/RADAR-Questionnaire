import { Pipe, PipeTransform } from '@angular/core'

import { Localisations } from '../../../../assets/data/localisations'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../enums/storage'
import { LanguageSetting } from '../../models/settings'

// TODO: Solve Globalization error: plugin_not_installed

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  language: LanguageSetting = {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  }
  preferredLang = this.language.value

  constructor(private storage: StorageService) {
    this.init()
  }

  init() {
    return this.storage.get(StorageKeys.LANGUAGE).then(language => {
      if (language) {
        this.language = language
        this.preferredLang = language.value
      } else {
        this.storage.set(StorageKeys.LANGUAGE, this.language)
      }
    })
  }

  getLanguage() {
    return this.language
  }

  transform(value: string): string {
    try {
      return Localisations[value][this.preferredLang]
    } catch (e) {
      console.log(e)
    }
    return ''
  }
}
