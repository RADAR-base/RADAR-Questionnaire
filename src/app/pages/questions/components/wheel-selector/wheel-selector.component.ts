import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

@Component({
  selector: 'wheel-selector',
  templateUrl: 'wheel-selector.component.html'
})
export class WheelSelectorComponent implements OnInit {
  @Input()
  values
  @Output()
  onSelect: EventEmitter<any> = new EventEmitter<any>()

  emitterLocked = false
  scrollHeight = 60
  selection: any[]

  constructor() {}

  ngOnInit() {
    this.selection = this.values.map(d => d[0])
  }

  selected(col, event) {
    if (!this.emitterLocked) {
      this.emitterLocked = true
      setTimeout(() => {
        const row = event.target.scrollTop / this.scrollHeight
        const value = this.values[col][row]
        this.selection[col] = value
        if (value) this.onSelect.emit(this.selection)
        this.emitterLocked = false
      }, 1000)
    }
  }
}
