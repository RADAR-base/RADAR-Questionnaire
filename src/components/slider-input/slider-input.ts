import {
  Component, Input, OnInit, Output, EventEmitter
} from '@angular/core';

@Component({
  selector: 'slider-input',
  templateUrl: 'slider-input.html'
})
export class SliderInputComponent implements OnInit {

  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>();

  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 10;

  value: number = null;

  ngOnInit() {}

  onInputChange() {
    this.valueChange.emit(this.value);
  }
}
