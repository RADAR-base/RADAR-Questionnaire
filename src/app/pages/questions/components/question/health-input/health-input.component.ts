import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Health_Requirement, Question } from 'src/app/shared/models/question'

import { Response } from '../../../../../shared/models/question'
import { HealthkitService } from '../../../services/healthkit.service'

@Component({
  selector: 'health-input',
  templateUrl: 'health-input.component.html',
  styleUrls: ['health-input.component.scss']
})
export class HealthInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<object> = new EventEmitter<object>()

  @Input()
  responses: Response[]

  @Input()
  health_question: Question

  health_display: string
  health_display_time: string
  isSupported = false

  constructor(private healthKitService: HealthkitService) {}

  ngOnInit() {
    this.loadData()
  }

  loadData() {
    let healthDataType = this.health_question.field_name
    if (this.health_question.field_name.includes('blood_pressure'))
      healthDataType = 'blood_pressure'
    this.healthKitService.checkHealthkitSupported().then(() => {
      this.isSupported = true
      if (this.isSupported) {
        this.health_display_time = new Date().toLocaleDateString()
        this.health_display = 'Loading..'
        this.healthKitService.loadData(healthDataType).then(data => {
          this.health_display = 'Loaded records'
          return this.valueChange.emit(data)
        })
      }
    }).catch(e => this.isSupported = false)
  }
}