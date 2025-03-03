import { Component, EventEmitter, Input, Output } from '@angular/core'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { UsageService } from 'src/app/core/services/usage/usage.service'
import { UsageEventType } from 'src/app/shared/enums/events'
import { IonicModule } from '@ionic/angular'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { NgIf } from '@angular/common'
import { IonButton } from '@ionic/angular/standalone'

@Component({
  selector: 'qr-form',
  templateUrl: 'qr-form.component.html',
  styleUrls: ['qr-form.component.scss'],
  imports: [TranslatePipe, NgIf, IonButton]
})
export class QRFormComponent {
  @Input()
  loading: boolean

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor(private usage: UsageService) {}

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
        this.data.emit(result.barcode.rawValue)
        // Removes the class after the scan (workaround for the camera not closing)
        document.querySelector('body').classList.remove('scanner-active')
      }
    )
    await BarcodeScanner.startScan() // start scanning and wait for a result
    this.usage.sendGeneralEvent(UsageEventType.QR_SCANNED)
  }
}
