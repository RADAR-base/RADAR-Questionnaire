import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core'
import { Health } from '@awesome-cordova-plugins/health/ngx'

type RadarSchema = {
  namespace: string
  type: string
  name: string
  doc: string
  fields: [
    {
      name: string
      type: string
      doc: string
      value: string
    },
    {
      name: string
      type: string
      doc: string
      value: string
    },
    {
      name: string
      type: string
      doc: string
      value: string
    },
    {
      name: string
      type: string
      doc: string
      value: string
    },
    {
      name: string
      type: string
      doc: string
      value: string
    }
  ]
}

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

  requirements = [
    { data: 'weight', value: '', timeInterval: 1 },
    { data: 'height', value: '', timeInterval: 1 }
  ]
  bloodPressure = 'No Data'
  bodyFat = 'No Data'
  bodyTemperature = 'No Data'
  heartRate = 'No Data'
  heartRateResting = 'No Data'
  highHeartRateNotifications = 'No Data'
  irregularRhythmNotifications = 'No Data'
  lowHeartRateNotifications = 'No Data'
  steps = 'No Data'
  weight = 'No Data'
  height = 'No Data'
  stepcount = 'No Data'
  radarSchema: RadarSchema[]
  workouts = []

  constructor(private health: Health) {
    const requireField = this.requirements.reduce((prev, cur) => {
      prev.push(cur.data)
      return prev
    }, [])
    console.log(requireField)
    this.health
      .isAvailable()
      .then((available: boolean) => {
        console.log(available)
        this.health
          .requestAuthorization([
            'distance',
            'nutrition', //read and write permissions
            {
              read: requireField, //read only permission
              write: ['height', 'weight'] //write only permission
            }
          ])
          .then(res => {
            this.loadData()
          })
          .catch(e => console.log(e))
      })
      .catch(e => console.log(e))
  }
  ngOnInit() {
    this.exportData()
    console.log('test', this.radarSchema)
    this.onInputChange(this.radarSchema)
  }

  onInputChange(event) {
    this.valueChange.emit(event)
  }
  reset() {
    this.loadData()
  }
  exportData() {
    this.radarSchema = [
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
            value: this.height
          },
          {
            name: 'bloodPressure',
            type: 'double',
            doc: 'data for bloodPressure, current unit will be ""',
            value: this.bloodPressure
          },
          {
            name: 'weight',
            type: 'double',
            doc: 'data for weight, current unit will be "kg"',
            value: this.weight
          },
          {
            name: 'bodyTemperature',
            type: 'double',
            doc: 'data for bodyTemperature, current unit will be "degC"',
            value: this.bodyTemperature
          },
          {
            name: 'heartRate',
            type: 'double',
            doc: 'data for heartRate, current unit will be "count/min"',
            value: this.heartRate
          }
        ]
      }
    ]
    console.log(this.radarSchema)
  }
  loadData() {
    this.requirements.forEach(r => {
      this.health
        .query({
          startDate: new Date(
            new Date().getTime() - 1000 * 24 * 60 * 60 * 1000
          ), // three days ago
          endDate: new Date(), // now
          dataType: r.data,
          limit: 1000
        })
        .then(res => {
          console.log(res[0])
          r.value = res[0].value + res[0].unit
        })
    })
  }
}
