import { Component, OnDestroy } from '@angular/core'
import { ModalController, NavParams, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { CacheSendService } from '../../services/cache-send.service'

@Component({
  selector: 'cache-send-modal',
  templateUrl: 'cache-send-modal.component.html',
  styleUrls: ['cache-send-modal.component.scss']
})
export class CacheSendModalComponent implements OnDestroy {
  successes: any[] = []
  errors: Error[] = []
  result = []
  segmentShown: string
  progress = 0
  etaText = ''
  isComplete = false

  private progressSub: Subscription
  private completionSub: Subscription

  constructor(
    public platform: Platform,
    public params: NavParams,
    public modalCtrl: ModalController,
    private cacheSendService: CacheSendService
  ) {
    // Subscribe to progress updates
    this.progressSub = this.cacheSendService.getProgress().subscribe(update => {
      this.progress = update.progress
      this.etaText = update.etaText
    })

    // Subscribe to completion updates
    this.completionSub = this.cacheSendService.getCompletion().subscribe(update => {
      if (update.isComplete) {
        this.result = update.data
        this.successes = update.successes
        this.errors = update.errors
        this.isComplete = true
      }
    })
  }

  dismiss() {
    this.modalCtrl.dismiss()
  }

  segmentChanged(event) {
    this.segmentShown = event.detail.value
  }

  ngOnDestroy() {
    if (this.progressSub) {
      this.progressSub.unsubscribe()
    }
    if (this.completionSub) {
      this.completionSub.unsubscribe()
    }
  }
}
