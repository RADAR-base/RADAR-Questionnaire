import { Pipe, PipeTransform } from '@angular/core'

import { Localisations } from '../../assets/data/localisations'
import { StorageKeys } from '../../enums/storage'
import { StorageService } from '../../providers/storage-service'

// Solve Globalization error: plugin_not_installed

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
    this.storage.get(StorageKeys.LANGUAGE).then(language => {
      this.preferredLang = language.value
    })
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
