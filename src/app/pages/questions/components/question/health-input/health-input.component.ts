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

  constructor(private health: Health) { }
  ngOnInit() {
    const requireField = [this.health_question.field_name]
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
      'time': this.health_display_time
    }
    console.log("Final Sumit Data: ", event)
    this.valueChange.emit(event)
  }

  async loadData() {

    // TODO: Error Handling for empty return 
    // Done: Implement LocalStorage
    // Done: Limit the float for UI 
    // Done: Check Andorid device when loading the data
      // * Still has some improvment for this UI dispaly

    // TODO: Processing the data 

    // !clearn the localstorage query 
    // localStorage.setItem('lastQueryTimeDic', null)

 
    const lastQueryTimeDic = localStorage.getItem('lastQueryTimeDic')
    console.log("LastQuery: ", lastQueryTimeDic)

    if(lastQueryTimeDic !== "null"){

      const dic = JSON.parse(lastQueryTimeDic) 

      console.log("Dic",dic)
      if(this.health_question.field_name in dic){
        console.log("Has Dic")
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
    const aggregatedField = [ 'steps', 'distance','calories','activity', 'nutrition']
    console.log('Start Date: ', queryStartDate.toLocaleDateString())
    console.log('End Date: ', queryEndDate.toLocaleDateString())
    //aggregated data 
    if ( aggregatedField.includes(this.health_question.field_name) || this.health_question.field_name.startsWith('nutrition') || this.health_question.field_name.startsWith('calories')){
      await this.health.queryAggregated({
        startDate: queryStartDate, // three days ago
        endDate: queryEndDate, // now
        dataType: this.health_question.field_name,
        bucket: 'day'
      }).then(res => {
        console.log("Value Before Updated: ", this.health_value);
        if(res === null){
          console.log(this.health_question.field_name, " is empty")
          this.health_value = null
          this.health_display = "There is no data for this date"
        }else{
          console.log("Field Name: ", this.health_question.field_name)
          const value = res[res.length-1].value 
          this.health_value = parseFloat(value)
          this.health_display = this.health_value.toString() + " " +  res[res.length-1].unit
        }
        this.health_display_time = res[res.length-1].startDate.toLocaleDateString()
        console.log("Value After Updated: ", this.health_value )
      })
    }
    else {
      await this.health
        .query({
          // put the lastDate in StartDate 
          startDate: queryStartDate,
          endDate: queryEndDate, // now
          dataType: this.health_question.field_name,
          limit: 1000
        })
        .then(res => {
          console.log("Value Before Updated: ", this.health_value);
          console.log("res", res);
          if(res.length === 0){
            console.log(this.health_question.field_name, " is empty")
            this.health_value = null
            this.health_display = "No data for today"
            this.health_display_time = new Date().toLocaleDateString()
          }
          else{
            if( this.health_question.field_name === 'blood_pressure'){
              const blood_pressure = res[0].value as any
              this.health_value = blood_pressure.systolic + '/' + blood_pressure.diastolic
              this.health_display = this.health_value.toFixed(2) + " " +  res[0].unit
            }
            else if (this.health_question.field_name === 'date_of_birth'){
              const value = res[0].value as any
              console.log(value.day + '/' + value.month + '/' + value.year)
              this.health_value = value.day + '/' + value.month + '/' + value.year
              this.health_display = this.health_value
            }
            else{
              console.log("Field Name: ", this.health_question.field_name)
              this.health_value = parseFloat(res[0].value)
              this.health_display = this.health_value.toFixed(2) + " " +  res[0].unit
            }
            // deal with time 
            console.log("Value After Updated: ", this.health_value )
            this.health_display_time = res[0].startDate.toLocaleDateString()
          }

        })
    }
  }
}
