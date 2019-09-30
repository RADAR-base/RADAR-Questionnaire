import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core'

@Component({
  selector: 'wheel-selector',
  templateUrl: 'wheel-selector.component.html'
})
export class WheelSelectorComponent implements AfterViewInit {
  @ViewChildren('wheel') wheels: QueryList<ElementRef>

  @Input()
  values
  @Input()
  selection
  @Input()
  labels
  @Output()
  onSelect: EventEmitter<any> = new EventEmitter<any>()

  emitterLocked = false
  scrollHeight = 60

  constructor() {}

  ngAfterViewInit() {
    if (this.selection) this.scrollToDefault()
  }

  scrollToDefault() {
    this.wheels.forEach((d, col) => {
      let row = this.values[col].findIndex(a => a == this.selection[col])
      if (row == -1) row = 0
      d.nativeElement.scrollTo(0, row * this.scrollHeight)
    })
  }

  selected(col, event) {
    if (!this.emitterLocked) {
      this.emitterLocked = true
      setTimeout(() => {
        const row = Math.round(event.target.scrollTop / this.scrollHeight)
        const value = this.values[col][row]
        this.selection[col] = value
        if (value) this.onSelect.emit(this.selection)
        this.emitterLocked = false
      }, 1000)
    }
  }
}
