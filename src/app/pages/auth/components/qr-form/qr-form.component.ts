import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { UsageService } from 'src/app/core/services/usage/usage.service'
import { UsageEventType } from 'src/app/shared/enums/events'

@Component({
  selector: 'qr-form',
  templateUrl: 'qr-form.component.html',
  styleUrls: ['qr-form.component.scss']
})
export class QRFormComponent {
  @Input()
  loading: boolean
  @Output()
  ory: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  qr: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  token: EventEmitter<any> = new EventEmitter<any>()

  ORY_KEY = 'ory'

  constructor(private usage: UsageService) { }

  async scanQRHandler() {
    this.loading = true
    document.querySelector('body').classList.add('scanner-active')
    // Check camera permission
    // This is just a simple example, check out the better checks below
    await BarcodeScanner.requestPermissions()

    // Add the `barcodeScanned` listener
    const listener = await BarcodeScanner.addListener(
      'barcodeScanned',
      async result => {
        await listener.remove()
        const data = result.barcode.rawValue
        if (data.includes(this.ORY_KEY)) {
          this.ory.emit(data)
        }
        else {
          this.qr.emit(data)
        }
        // Removes the class after the scan (workaround for the camera not closing)
        document.querySelector('body').classList.remove('scanner-active')
      }
    )
    await BarcodeScanner.startScan() // start scanning and wait for a result
    this.usage.sendGeneralEvent(UsageEventType.QR_SCANNED)
  }

  enterTokenHandler() {
    this.token.emit()
  }
}
