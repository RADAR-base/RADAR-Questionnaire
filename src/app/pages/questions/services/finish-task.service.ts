import { Injectable } from '@angular/core'
import {
  HealthKitDataTypeKey,
  HealthkitStringDataType
} from 'src/app/shared/models/health'

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
  ) {}

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule
        .updateTaskToComplete(task)
        .then(res => this.schedule.updateTaskToReportedCompletion(task)),
      task.type == AssessmentType.SCHEDULED
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  processDataAndSend(answers, questions, timestamps, task) {
    // NOTE: Do not send answers if demo questionnaire
    if (task.isDemo) return Promise.resolve()
    if (questions.some(question => question.field_type === 'health')) {
      const results = this.processHealthQuestionnaireData(
        answers,
        timestamps,
        questions
      )
      Object.keys(results).forEach(key =>
        this.sendAnswersToKafka(results[key], task)
      )
    } else {
      return this.sendAnswersToKafka(
        this.processQuestionnaireData(answers, timestamps, questions),
        task
      )
    }
  }

  sendAnswersToKafka(processedAnswers, task) {
    // If it's from health
    if (processedAnswers instanceof Array) {
      return Promise.all(
        processedAnswers.map(p => {
          return this.kafka.prepareKafkaObjectAndSend(
            SchemaType.GENERAL_HEALTH,
            {
              task: task,
              data: p
            }
          )
        })
      ).then(cacheValues => this.kafka.storeHealthDataInCache(cacheValues))
    } else {
      return this.appConfig.getScheduleVersion().then(scheduleVersion => {
        return Promise.all([
          this.kafka.prepareKafkaObjectAndSend(SchemaType.TIMEZONE, {}),
          this.kafka.prepareKafkaObjectAndSend(SchemaType.ASSESSMENT, {
            task: task,
            data: Object.assign(processedAnswers, { scheduleVersion })
          })
        ]).then(([timezone, assessment]) => {
          return Promise.all([
            this.kafka.storeInCache(timezone),
            this.kafka.storeInCache(assessment)
          ]).then(() => this.kafka.sendAllFromCache())
        })
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

  processHealthQuestionnaireData(answers, timestamps, questions) {
    // this.logger.log('Answers to process', answers)

    let results = {}
    for (let [key, value] of Object.entries<any>(answers)) {
      // value is array of datapoints
      // key is name of data type
      if (value.length) {
        const type = this.getDataTypeFromKey(key)
        const formatted = value.map(v =>
          Object.assign(
            {},
            {
              startTime: new Date(v.startDate).getTime(),
              endTime: new Date(v.endDate).getTime(),
              timeReceived: Date.now(),
              sourceId: v.sourceBundleId,
              sourceName: v.sourceName,
              unit: v.unit,
              key,
              intValue: null,
              floatValue: null,
              doubleValue: null,
              stringValue: null
            },
            { [type]: v.value }
          )
        )
        results[key] = formatted
      }
    }
    return results
  }

  getDataTypeFromKey(key) {
    if (
      Object.values(HealthkitStringDataType).includes(
        key as HealthkitStringDataType
      )
    ) {
      return HealthKitDataTypeKey.STRING
    } else return HealthKitDataTypeKey.FLOAT
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
