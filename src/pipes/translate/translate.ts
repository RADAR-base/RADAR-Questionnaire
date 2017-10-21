import { Pipe, PipeTransform } from '@angular/core';
import { Globalization } from '@ionic-native/globalization';
import { Localisations } from '../../assets/data/localisations';

// Solve Globalization error: plugin_not_installed

@Pipe({
  name: 'translate',
})
export class TranslatePipe implements PipeTransform {

  fallBackLang: string = 'en';
  preferredLang: string = this.fallBackLang;

  constructor(private globalization: Globalization) {
    this.globalization.getPreferredLanguage()
      .then(res => {
        this.preferredLang = res.value;
      })
      .catch(err => {
        console.log('TranslatePipe: ' + err);
        this.preferredLang = this.fallBackLang;
      });
  }

  transform(value: string): string {
    try {
      return Localisations[value][this.preferredLang];
    } catch(e) {
      console.log(e)
    }
    return '';
  }
}
