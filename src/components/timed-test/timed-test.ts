import { Component, EventEmitter, Input, Output } from '@angular/core'

let uniqueID = 0

@Component({
  selector: 'timed-test',
  templateUrl: 'timed-test.html'
})
export class TimedTestComponent {

  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input() heading: string
  @Input() image: string
  @Input() timer: number

  value: number = null
  
  onInputChange (event) {
    this.valueChange.emit(+event.target.value)
  }
}
