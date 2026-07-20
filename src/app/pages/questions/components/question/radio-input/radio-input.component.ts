import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'radio-input',
  templateUrl: 'radio-input.component.html',
  styleUrls: ['radio-input.component.scss']
})
export class RadioInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `radio-input-${this.uniqueID}`
  items: Item[] = Array()
  hasImageOnlyOptions = false

  ngOnInit() {
    this.responses.map((item, i) => {
      const parsed = this.parseLabel(item.label)
      this.items.push({
        id: `radio-${this.uniqueID}-${i}`,
        response: parsed.text,
        image: parsed.image,
        value: item.code
      })
    })
    this.hasImageOnlyOptions =
      this.items.length > 0 && this.items.every(i => i.image && !i.response)
  }

  onInputChange(event) {
    this.valueChange.emit(event.detail.value)
  }

  /**
   * Optional image format for radio labels:
   * - "img:/path/to/image.png"
   * - "img:/path/to/image.png|Optional caption"
   */
  private parseLabel(label: string): { text: string; image?: string } {
    if (!label) return { text: '' }
    if (!label.startsWith('img:')) return { text: label }

    const raw = label.replace(/^img:/, '').trim()
    const [image, caption] = raw.split('|')
    return {
      text: (caption || '').trim(),
      image: image?.trim()
    }
  }
}
