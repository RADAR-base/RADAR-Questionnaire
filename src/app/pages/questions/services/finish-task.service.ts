import { Injectable } from '@angular/core'

import { AppConfigService } from '../../../core/services/config/app-config.service'
import { ConfigService } from '../../../core/services/config/config.service'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { LogService } from '../../../core/services/misc/log.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../shared/models/assessment'
import { SchemaType } from '../../../shared/models/kafka'
import { QuestionType } from '../../../shared/models/question'

@Injectable({
  providedIn: 'root'
})
export class FinishTaskService {
  constructor(
    private schedule: ScheduleService,
    private kafka: KafkaService,
    private config: ConfigService,
    private appConfig: AppConfigService,
    private logger: LogService
  ) { }

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule.updateTaskToComplete(task),
      this.schedule.updateTaskToReportedCompletion(task),
      task.type == AssessmentType.SCHEDULED
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  processDataAndSend(answers, questions, timestamps, task) {
    // NOTE: Do not send answers if demo questionnaire
    if (task.isDemo) return Promise.resolve()
    console.log("Answers", answers)
    console.log("Questions", questions)
    console.log("task", task)

    if (questions.some((question)=> question.field_type === 'health')) {
      const results = this.processHealthQuestionnaireData(answers, timestamps, questions)
      console.log('results', results)
      results.forEach((result)=>{
        return this.sendAnswersToKafka(
            result,
            task
          )
      })


    } else {
      return this.sendAnswersToKafka(
          this.processQuestionnaireData(answers, timestamps, questions),
          task
      )
    }
  }



  sendAnswersToKafka(processedAnswers, task): Promise<any> {
    // if it's from health 
    if("timeInterval" in processedAnswers){
      return this.appConfig.getScheduleVersion().then(scheduleVersion => {
        return Promise.all([
          this.kafka.prepareKafkaObjectAndSend(SchemaType.TIMEZONE, {}),
          this.kafka.prepareKafkaObjectAndSend(SchemaType.AGGREGATED_HEALTH, {
            task: task,
            data: Object.assign(processedAnswers, { scheduleVersion })
          })
        ])
      })
    }
    else if("key" in processedAnswers){
      return this.appConfig.getScheduleVersion().then(scheduleVersion => {
        return Promise.all([
          this.kafka.prepareKafkaObjectAndSend(SchemaType.TIMEZONE, {}),
          this.kafka.prepareKafkaObjectAndSend(SchemaType.GENERAL_HEALTH, {
            task: task,
            data: Object.assign(processedAnswers, { scheduleVersion })
          })
        ])
      })
    }
    // 
    // NOTE: Submit data to kafka
    else{
      return this.appConfig.getScheduleVersion().then(scheduleVersion => {
        return Promise.all([
          this.kafka.prepareKafkaObjectAndSend(SchemaType.TIMEZONE, {}),
          this.kafka.prepareKafkaObjectAndSend(SchemaType.ASSESSMENT, {
            task: task,
            data: Object.assign(processedAnswers, { scheduleVersion })
          })
        ])
      })
    }
  }

  createClinicalFollowUpTask(assessment): Promise<any> {
    return this.schedule
      .generateSingleAssessmentTask(
        assessment,
        AssessmentType.CLINICAL,
        Date.now()
      )
      .then(() => this.config.rescheduleNotifications())
  }
  // TODO process for general questionnaire schema


  processHealthQuestionnaireData(answers, timestampes, questions) {
    this.logger.log('Answers to process', answers)
    console.log('timestamp', timestampes)

    //* Go with genreal schema 
    // const result = null;
    let results = [];
    for (const [key, value] of Object.entries<any>(answers)) {
      if(value.value !== null && value.value !== undefined){

        let result = {}
        const aggregatedField = [ 'steps', 'distance','calories','activity', 'nutrition']

        // * judge if it's for general or for aggregation 
        if(aggregatedField.includes(key) || key.startsWith('nutrition') || key.startsWith('calories')){

          result = {
            ...answers,
            time: timestampes[questions[0].field_name].startTime, // from the data 
            timeReceived: timestampes[questions[questions.length - 1].field_name].endTime, // 
            timeInterval: 1
          }
        }
        else{
          result = {
            time: timestampes[questions[0].field_name].startTime,
            timeReceived: value.time,
            key: key,
            value: value.value
          }
        }

        results.push(result)
      }
      console.log(`${key}: ${value}`);
    }



    //* Go with aggregation schema
    const result = {
      ...answers,
      time: timestampes[questions[0].field_name].startTime, // from the data 
      timeReceived: timestampes[questions[questions.length - 1].field_name].endTime, // 
    }

    return results
  }
  processQuestionnaireData(answers, timestamps, questions) {
    this.logger.log('Answers to process', answers)
    const values = Object.entries(answers)
      .filter(([k, v]) => timestamps[k])
      .map(([key, value]) => ({
        questionId: { string: key.toString() },
        value: { string: value.toString() },
        startTime: timestamps[key].startTime,
        endTime: timestamps[key].endTime
      }))
    console.log(values)
    return {
      answers: values,
      scheduleVersion: '',
      time: this.getTimeStart(questions, values),
      timeCompleted: this.getTimeCompleted(values)
    }
  }

  getTimeStart(questions, answers) {
    // NOTE: Do not include info screen as start time
    const index = questions.findIndex(q => q.field_type !== QuestionType.info)
    return index > -1 && answers[index]
      ? answers[index].startTime
      : answers[0].startTime
  }

  getTimeCompleted(answers) {
    return answers[answers.length - 1].endTime
  }

  cancelNotificationsForCompletedTask(task): Promise<any> {
    console.log('Cancelling pending reminders for task..')
    const notifications = task.notifications ? task.notifications : []
    return notifications.forEach(n => this.config.cancelSingleNotification(n))
  }
}
