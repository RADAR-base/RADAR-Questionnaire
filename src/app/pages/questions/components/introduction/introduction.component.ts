import { Component, EventEmitter, Input, Output } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { addIcons } from 'ionicons'
import { closeCircle } from 'ionicons/icons'
import { IonButton, IonIcon, IonItem } from '@ionic/angular/standalone'

@Component({
  selector: 'introduction',
  templateUrl: 'introduction.component.html',
  styleUrls: ['introduction.component.scss'],
  imports: [TranslatePipe, IonItem, IonIcon, IonButton]
})
export class IntroductionComponent {
  @Input()
  introduction
  @Input()
  title
  @Output()
  start: EventEmitter<any> = new EventEmitter<any>()

  constructor() {
    addIcons({ closeCircle })
  }

  hideIntro() {
    this.start.emit(false)
  }

  startQuestionnaire() {
    this.start.emit(true)
  }
}
