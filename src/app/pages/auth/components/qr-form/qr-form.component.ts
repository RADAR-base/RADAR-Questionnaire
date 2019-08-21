import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx'

@Component({
  selector: 'qr-form',
  templateUrl: 'qr-form.component.html'
})
export class QRFormComponent {
  @Input()
  loading: boolean

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor(private scanner: BarcodeScanner) {}

  scanQRHandler() {
    const scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
    }
    return this.scanner.scan(scanOptions).then(res => this.data.emit(res.text))
  }
}
