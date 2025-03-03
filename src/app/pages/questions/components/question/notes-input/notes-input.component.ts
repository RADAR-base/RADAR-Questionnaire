import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Keyboard } from '@capacitor/keyboard'
import { IonicModule, ModalController } from '@ionic/angular'

import { LocalizationService } from '../../../../../core/services/misc/localization.service'
import { KeyboardEventType } from '../../../../../shared/enums/events'
import { TranslatePipe } from '../../../../../shared/pipes/translate/translate'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'notes-input',
  templateUrl: 'notes-input.component.html',
  styleUrls: ['notes-input.component.scss'],
  imports: [IonicModule, TranslatePipe, FormsModule]
})
export class NotesInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()
  @Output()
  keyboardEvent: EventEmitter<string> = new EventEmitter<string>()
  @Input()
  type: string
  @Input()
  currentlyShown: boolean

  textValue = ''
  value = {}
  keyboard = Keyboard

  constructor(
    private localization: LocalizationService,
    public modalCtrl: ModalController
  ) {}

  ngOnInit() {}

  emitAnswer(value) {
    this.valueChange.emit(this.textValue)
  }

  emitKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER) this.keyboard.hide()

    this.keyboardEvent.emit(value)
  }
}
