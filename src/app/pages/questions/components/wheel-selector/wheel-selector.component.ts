import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core'

import { Utility } from '../../../../shared/utilities/util'
import { IonicModule } from '@ionic/angular'
import { NgForOf } from '@angular/common'

@Component({
  selector: 'app-wheel-selector',
  templateUrl: 'wheel-selector.component.html',
  styleUrls: ['wheel-selector.component.scss'],
  imports: [IonicModule, NgForOf]
})
export class WheelSelectorComponent implements AfterViewInit, OnInit {
  keys = Object.keys
  @ViewChildren('wheel') wheels: QueryList<ElementRef>

  @Input()
  values: { [key: string]: string[] }
  @Input()
  selection: { [key: string]: string }
  @Input()
  labels: { [key: string]: string }
  @Output()
  onSelect: EventEmitter<any> = new EventEmitter<any>()

  valuesWithNulls

  emitterLocked = false
  scrollHeight = 40

  constructor(private util: Utility) {}

  ngOnInit() {
    this.valuesWithNulls = this.util.deepCopy(this.values)
    this.addNullValues()
  }

  ngAfterViewInit() {
    console.log(this.valuesWithNulls)
    if (this.selection) this.scrollToDefault()
  }

  addNullValues() {
    const keys = this.keys(this.valuesWithNulls)
    keys.forEach(d => {
      this.valuesWithNulls[d].unshift('-')
      this.valuesWithNulls[d].push('-')
    })
  }

  scrollToDefault() {
    this.wheels.forEach((d, i) => {
      const col = this.keys(this.valuesWithNulls)[i]
      let row =
        this.valuesWithNulls[col].findIndex(a => a == this.selection[col]) - 1
      if (row < 0) row = 0
      d.nativeElement.scrollTo(0, row * this.scrollHeight)
    })
  }

  selected(col, event) {
    if (!this.emitterLocked) {
      this.emitterLocked = true
      setTimeout(() => {
        const row = Math.round(event.target.scrollTop / this.scrollHeight) + 1
        const value = this.valuesWithNulls[col][row]
        if (value) {
          this.selection[col] = value
          this.onSelect.emit(this.selection)
        }
        this.emitterLocked = false
      }, 1000)
    }
  }
}
