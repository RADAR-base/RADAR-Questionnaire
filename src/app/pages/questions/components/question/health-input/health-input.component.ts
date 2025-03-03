import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'
import { Question } from 'src/app/shared/models/question'

import { Response } from '../../../../../shared/models/question'
import { HealthkitService } from '../../../services/healthkit.service'

@Component({
  selector: 'health-input',
  templateUrl: 'health-input.component.html',
  styleUrls: ['health-input.component.scss'],
})
export class HealthInputComponent implements OnChanges {
  @Output()
  valueChange: EventEmitter<object> = new EventEmitter<object>()
  @Input()
  responses: Response[]
  @Input()
  health_question: Question
  @Input()
  currentlyShown: boolean
  @Input()
  refTimestamp: number

  health_display: string
  health_display_time: string
  isSupported = false

  constructor(private healthKitService: HealthkitService) {}

  ngOnChanges() {
    if (this.currentlyShown) {
      this.loadData()
    }
  }

  loadData() {
    let healthDataType = this.health_question.field_name
    this.healthKitService
      .checkHealthkitSupported()
      .then(() => {
        this.isSupported = true
        if (this.isSupported) {
          this.health_display_time = new Date().toLocaleDateString()
          this.health_display = 'Loading..'
          this.healthKitService
            .loadData(healthDataType, new Date(this.refTimestamp))
            .then(data => {
              this.health_display = 'Loaded records'
              return this.valueChange.emit(data)
            })
        }
      })
      .catch(e => (this.isSupported = false))
  }
}
