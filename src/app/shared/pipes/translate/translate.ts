import { Pipe, PipeTransform } from '@angular/core'

import { LocalizationService } from '../../../core/services/localization.service'

// TODO: Solve Globalization error: plugin_not_installed

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private localization: LocalizationService) {}

  transform(value: string): string {
    return this.localization.translate(value)
  }
}
