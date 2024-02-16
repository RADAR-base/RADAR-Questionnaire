import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'

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

  constructor() {}

  scanQRHandler() {
    const scanOptions = {
      showFlipCameraButton: true,
      orientation: 'portrait'
    }
    BarcodeScanner.checkPermission({ force: true }).then(() => {
      BarcodeScanner.hideBackground().then(() =>
        BarcodeScanner.startScan().then(res => this.data.emit(res.content))
      )
    })
  }
}
