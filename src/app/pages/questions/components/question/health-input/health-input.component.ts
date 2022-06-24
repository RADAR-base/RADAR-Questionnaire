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
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]

  bloodPressure = 'No Data'
  bodyFat = 'No Data'
  bodyTemperature = 'No Data'
  heartRate = 'No Data'
  highHeartRateNotifications = 'No Data'
  irregularRhythmNotifications = 'No Data'
  lowHeartRateNotifications = 'No Data'
  steps = 'No Data'
  weight = 'No Data'
  height = 'No Data'
  stepcount = 'No Data'
  radarSchema: RadarSchema
  workouts = []

  constructor(private health: Health) {
    this.health
      .isAvailable()
      .then((available: boolean) => {
        console.log(available)
        this.health
          .requestAuthorization([
            'distance',
            'nutrition', //read and write permissions
            {
              read: [
                'steps',
                'height',
                'weight',
                'heart_rate',
                'blood_pressure',
                'gender',
                'temperature'
              ], //read only permission
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
  ngOnInit() {}

  onInputChange(event) {
    this.valueChange.emit(event)
  }
  reset() {
    this.loadData()
  }
  // exportData() {
  //   this.radarSchema = {
  //     namespace: 'org.radarcns.active.health',
  //     type: 'record',
  //     name: 'patient302',
  //     doc: 'General health data for patient',
  //     fields: [
  //       {
  //         name: 'height',
  //         type: 'double',
  //         doc: 'data for height, current unit will be "m"',
  //         value: this.height
  //       },
  //       {
  //         name: 'bloodPressure',
  //         type: 'double',
  //         doc: 'data for bloodPressure, current unit will be ""',
  //         value: this.bloodPressure
  //       },
  //       {
  //         name: 'weight',
  //         type: 'double',
  //         doc: 'data for weight, current unit will be "kg"',
  //         value: this.weight
  //       },
  //       {
  //         name: 'bodyTemperature',
  //         type: 'double',
  //         doc: 'data for bodyTemperature, current unit will be "degC"',
  //         value: this.bodyTemperature
  //       },
  //       {
  //         name: 'heartRate',
  //         type: 'double',
  //         doc: 'data for heartRate, current unit will be "count/min"',
  //         value: this.heartRate
  //       }
  //     ]
  //   }
  //   console.log(this.radarSchema)
  // }
  loadData() {
    // For height
    this.health
      .query({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'height',
        limit: 1000
      })
      .then(res => {
        console.log(res[0].value)
        this.height = res[0].value + res[0].unit
      })
    this.health
      .query({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'blood_pressure',
        limit: 1000
      })
      .then((res: any) => {
        this.bloodPressure =
          res[0].value.diastolic + '/' + res[0].value.systolic + res[0].unit
      })
    this.health
      .query({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'weight',
        limit: 1000
      })
      .then((res: any) => {
        console.log(res)
        this.weight = res[0].value + res[0].unit
      })
    this.health
      .query({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'temperature',
        limit: 1000
      })
      .then((res: any) => {
        console.log(res)
        this.bodyTemperature = res[0].value + res[0].unit
      })
    this.health
      .query({
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'heart_rate',
        limit: 1000
      })
      .then((res: any) => {
        console.log(res)
        this.heartRate = res[0].value + res[0].unit
      })
  }
}
