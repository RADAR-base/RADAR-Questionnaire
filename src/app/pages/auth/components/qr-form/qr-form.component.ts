import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx'

@Component({
  selector: 'qr-form',
  templateUrl: 'qr-form.component.html',
  styleUrls: ['qr-form.component.scss']
})
export class QRFormComponent {
  @Input()
  loading: boolean

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor(private scanner: BarcodeScanner) {}

  scanQRHandler() {
    console.log('Class: QRFormComponent, Function: scanQRHandler, Line 19 ' , );
    const scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
    }
    console.log('Class: QRFormComponent, Function: scanQRHandler, Line 24 scanOptions' , scanOptions);
    return this.scanner.scan(scanOptions).then(res => this.data.emit(res.text))
  }
}
