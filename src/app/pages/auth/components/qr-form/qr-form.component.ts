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

  async scanQRHandler() {
    document.querySelector('body').classList.add('scanner-active')
    // Check camera permission
    // This is just a simple example, check out the better checks below
    await BarcodeScanner.checkPermission({ force: true })

    // make background of WebView transparent
    // note: if you are using ionic this might not be enough, check below
    BarcodeScanner.hideBackground()

    const result = await BarcodeScanner.startScan() // start scanning and wait for a result

    // if the result has content
    if (result.hasContent) {
      this.data.emit(result.content)
    }
    document.querySelector('body').classList.remove('scanner-active');
  }
}
