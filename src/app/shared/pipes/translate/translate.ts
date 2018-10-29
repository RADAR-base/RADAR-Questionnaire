import { Pipe, PipeTransform } from '@angular/core'

import { Localisations } from '../../../../assets/data/localisations'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../enums/storage'

// TODO: Solve Globalization error: plugin_not_installed

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  fallBackLang: string = 'en'
  preferredLang: string = this.fallBackLang

  constructor(private storage: StorageService) {
    this.storage.get(StorageKeys.LANGUAGE).then(language => {
      this.preferredLang = language.value
    })
  }

  reinit() {
    return this.storage
      .get(StorageKeys.LANGUAGE)
      .then(language => (this.preferredLang = language.value))
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
