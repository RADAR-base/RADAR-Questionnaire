import { Component } from '@angular/core';

/**
 * Generated class for the InfoBar component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'info-bar',
  templateUrl: 'info-bar.html'
})
export class InfoBarComponent {

  text: string;

  constructor() {
    console.log('Hello InfoBar Component');
    this.text = 'Hello World';
  }

}
