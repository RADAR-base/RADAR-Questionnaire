import { Component } from '@angular/core';
import { MediaCapture, MediaFile, CaptureError, CaptureImageOptions } from '@ionic-native/media-capture';

/**
 * Generated class for the AudioInputComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.html'
})
export class AudioInputComponent {

  text: string;

  constructor() {
    console.log('Hello AudioInputComponent Component');
    this.text = 'Hello World';
  }

}
