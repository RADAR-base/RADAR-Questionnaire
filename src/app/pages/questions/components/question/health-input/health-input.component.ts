import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core'
import { Health } from '@awesome-cordova-plugins/health/ngx'
import { Health_Requirement, Question } from 'src/app/shared/models/question'

@Component({
  selector: 'health-input',
  templateUrl: 'health-input.component.html',
  styleUrls: ['health-input.component.scss']
})
export class HealthInputComponent implements OnInit {
  // 1. JUDGE BY HEALTH INPUT TYPE TO DECIDE WHAT DATA WE NEED
  // 2. PRINT OUT THE DATA AND REQUEST ACCORDINGLY
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]

  @Input()
  health_question: Question

  health_requirements: Health_Requirement[] = [
    {
      data_name: 'weight',
      time_intervals: '1000',
      value: ''
    },
    {
      data_name: 'height',
      time_intervals: '1000',
      value: ''
    },
    {
      data_name: 'blood_pressure',
      time_intervals: '1000',
      value: ''
    }
  ]

  health_value: string
  test_data: any

  constructor(private health: Health) {}
  ngOnInit() {
    console.log(this.health_question)
    const requireField = [this.health_question.field_name]
    console.log(requireField)
    this.health
      .isAvailable()
      .then((available: boolean) => {
        console.log(available)
        this.health
          .requestAuthorization([
            // 'distance',
            // 'nutrition', //read and write permissions
            {
              read: requireField //read only permission
              // write: ['height', 'weight'] //write only permission
            }
          ])
          .then(res => {
            this.loadData()
          })
          .catch(e => console.log(e))
      })
      .catch(e => console.log(e))
    this.exportData()
    this.onInputChange(this.test_data)
  }

  onInputChange(event) {
    this.valueChange.emit(event)
  }
  reset() {
    this.loadData()
  }
  exportData() {
    this.test_data = [
      {
        namespace: 'org.radarcns.connector.health',
        type: 'record',
        name: 'patient302',
        doc: 'General health data for patient',
        fields: [
          {
            name: 'height',
            type: 'double',
            doc: 'data for height, current unit will be "m"',
            value: 'test'
          }
        ]
      }
    ]
  }
  loadData() {
    this.health
      .query({
        startDate: new Date(new Date().getTime() - 1000 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: this.health_question.field_name,
        limit: 1000
      })
      .then(res => {
        this.health_value = res[0].value + res[0].unit
      })
  }
}
