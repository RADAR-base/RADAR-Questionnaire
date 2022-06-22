import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core'

@Component({
  selector: 'health-input',
  templateUrl: 'health-input.component.html',
  styleUrls: ['health-input.component.scss']
})
export class HealthInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]
  constructor() {}

  ngOnInit() {}

  onInputChange(event) {
    this.valueChange.emit(event)
  }
}
