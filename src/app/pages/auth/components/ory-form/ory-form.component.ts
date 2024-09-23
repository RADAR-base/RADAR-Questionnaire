import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'

@Component({
  selector: 'ory-form',
  templateUrl: 'ory-form.component.html',
  styleUrls: ['ory-form.component.scss']
})
export class OryFormComponent {
  @Input()
  loading: boolean

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor() {}

  async scanQRHandler() {
    document.querySelector('body').classList.add('scanner-active')
    // Check camera permission
    // This is just a simple example, check out the better checks below
    await BarcodeScanner.requestPermissions()

     // Add the `barcodeScanned` listener
    const listener = await BarcodeScanner.addListener(
    'barcodeScanned',
    async result => {
      await listener.remove();
      this.data.emit(result.barcode.rawValue)
      document.querySelector('body').classList.remove('scanner-active');
    },
    );
    await BarcodeScanner.startScan() // start scanning and wait for a result
  }
}
