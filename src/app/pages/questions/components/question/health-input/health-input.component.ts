import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core'
import { Health } from '@awesome-cordova-plugins/health/ngx'
import { Health_Requirement, Question } from 'src/app/shared/models/question'

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

  health_value: any
  health_display: any
  health_display_time: any 
  health_time: any
  not_support = false 
  // the interval days for first query 
  defaultInterval = 1000

  // the bucket for aggregated query 
  defaultBucket = 'day'
  
  constructor(private health: Health) { }
  ngOnInit() {
    let requireField = []
    if(this.health_question.field_name === 'blood_pressure_systolic' || this.health_question.field_name === 'blood_pressure_diastolic'){
      requireField = ['blood_pressure']
    }
    else{
      requireField = [this.health_question.field_name]
    }
    this.health
      .isAvailable()
      .then((available: boolean) => {
        this.health
          .requestAuthorization([
            // 'nutrition', //read and write permissions
            {
              read: requireField //read only permission
              // write: ['height', 'weight'] //write only permission
            }
          ])
          .then(res => {
            this.loadData().then(() =>{
              this.onInputChange()
            })
          })
          .catch(e => console.log(e))
      })
      .catch(e => {
        this.not_support = true 
      })
  }

  onInputChange() {
    const event = {
      'value' : this.health_value,
      'time': this.health_time
    }
    console.log("Final Sumit Data: ", event)
    this.valueChange.emit(event)
  }

  async loadData() {
    // * Still has some improvment for this UI dispaly


    // // !clearn the localstorage query  ( For testing )
    // localStorage.setItem('lastQueryTimeDic', null)

 
    const lastQueryTimeDic = localStorage.getItem('lastQueryTimeDic')
    // console.log("LastQuery: ", lastQueryTimeDic)

    if(lastQueryTimeDic !== "null"){

      const dic = JSON.parse(lastQueryTimeDic) 

      if(this.health_question.field_name in dic){
        await this.query(new Date(dic[this.health_question.field_name]), new Date())
      }
      else{
        await this.query(new Date(new Date().getTime() - this.defaultInterval * 24 * 60 * 60 * 1000), new Date())
      }
      dic[this.health_question.field_name] = new Date().toLocaleDateString()
      localStorage.setItem('lastQueryTimeDic', JSON.stringify(dic))
    }
    else{ 

      await this.query(new Date(new Date().getTime() - this.defaultInterval * 24 * 60 * 60 * 1000), new Date())
      const newDic = {
        [this.health_question.field_name]: new Date().toLocaleDateString()
      }
      localStorage.setItem('lastQueryTimeDic', JSON.stringify(newDic))
    }
    
  }

  async query(queryStartDate: Date, queryEndDate: Date){
     // !Will have to remove activity here, since each activity acutally contains more payload
     // !Set the acitiviy to be UNKNOWN for now to avoid schema confliction 
    const aggregatedField = [ 'steps', 'distance','calories','activity', 'nutrition']
    //aggregated data 
    if ( aggregatedField.includes(this.health_question.field_name) || this.health_question.field_name.startsWith('nutrition') || this.health_question.field_name.startsWith('calories')){
      await this.health.queryAggregated({
        startDate: queryStartDate, 
        endDate: queryEndDate, 
        dataType: this.health_question.field_name,
        bucket: this.defaultBucket 
      }).then(res => {
        if(res === null){
          this.health_value = null
          this.health_display = "There is no data for this date"
        }else{
          if(this.health_question.field_name === "activity"){
            const value = res[res.length-1].value 
            this.health_value = "UNKNOWN"
          }
          else{
            const value = res[res.length-1].value 
            this.health_value = parseFloat(value)
          }
          this.health_display = this.health_value.toString() + " " +  res[res.length-1].unit
        }
        this.health_display_time = res[res.length-1].startDate.toLocaleDateString()
        this.health_time = Math.floor(res[res.length-1].startDate.getTime()/1000)
      })
    }
    else {
      if(this.health_question.field_name === 'blood_pressure_systolic' || this.health_question.field_name === 'blood_pressure_diastolic' ){
        await this.health
          .query({
            // put the lastDate in StartDate 
            startDate: queryStartDate,
            endDate: queryEndDate, // now
            dataType: 'blood_pressure',
            limit: 1000
          }) 
          .then(res => {
            if(res.length === 0){
              this.health_value = null
              this.health_display = "No data for today"
              this.health_display_time = new Date().toLocaleDateString()
              this.health_time = Math.floor(res[0].startDate.getTime()/1000)
            }
            else{
              const blood_pressure = res[0].value as any
              if(this.health_question.field_name ==='blood_pressure_systolic'){
                this.health_value = blood_pressure.systolic
              }else{
                this.health_value = blood_pressure.diastolic
              }
              this.health_display = this.health_value.toFixed(2) + " " +  res[0].unit
              this.health_time = Math.floor(res[0].startDate.getTime()/1000)
            }
          })
      }
      else{
        await this.health
          .query({
            // put the lastDate in StartDate 
            startDate: queryStartDate,
            endDate: queryEndDate, // now
            dataType: this.health_question.field_name,
            limit: 1000
          })
          .then(res => {
            if(res.length === 0){
              this.health_value = null
              this.health_display = "No data for today"
              this.health_display_time = new Date().toLocaleDateString()
              this.health_time = Math.floor(res[0].startDate.getTime()/1000)
            }
            else{
              if (this.health_question.field_name === 'date_of_birth'){
                const value = res[0].value as any
                this.health_value = value.day + '/' + value.month + '/' + value.year
                this.health_display = this.health_value
              }
              else{
                this.health_value = parseFloat(res[0].value)
                this.health_display = this.health_value.toFixed(2) + " " +  res[0].unit
              }
              // deal with time 
              this.health_display_time = res[0].startDate.toLocaleDateString()
              this.health_time = Math.floor(res[0].startDate.getTime()/1000)
            }

          })
      }
    }
  }
}
