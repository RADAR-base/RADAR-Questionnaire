import { Component } from '@angular/core'
import { IonicModule, ModalController, NavParams, Platform } from '@ionic/angular'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { NgForOf, NgIf, NgSwitch, NgSwitchCase } from '@angular/common'
import { addIcons } from 'ionicons'
import { alertCircleOutline, checkmarkCircle } from 'ionicons/icons'
import {
  IonCard,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonLabel, IonList,
  IonRow,
  IonSegment, IonSegmentButton
} from '@ionic/angular/standalone'

@Component({
  selector: 'cache-send-modal',
  templateUrl: 'cache-send-modal.component.html',
  styleUrls: ['cache-send-modal.component.scss'],
  imports: [
    TranslatePipe,
    NgSwitch,
    NgIf,
    NgSwitchCase,
    NgForOf,
    IonCard,
    IonCardHeader,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonList
  ]
})
export class CacheSendModalComponent {
  successes: any[]
  errors: Error[]
  result = []
  segementShown: string

  constructor(
    public platform: Platform,
    public params: NavParams,
    public modalCtrl: ModalController
  ) {
    addIcons({ checkmarkCircle, alertCircleOutline })
    this.result = this.params.get('data')
    this.errors = this.result['failedKeys']
    this.successes = this.result['successKeys']
  }

  dismiss() {
    this.modalCtrl.dismiss()
  }

  segmentChanged(event) {
    this.segementShown = event.detail.value
  }
}
