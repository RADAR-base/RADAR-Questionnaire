import { Injectable } from '@angular/core'

import { AppConfigService } from '../../../core/services/config/app-config.service'
import { ConfigService } from '../../../core/services/config/config.service'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { LogService } from '../../../core/services/misc/log.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { SchemaType } from '../../../shared/models/kafka'
import { QuestionType } from '../../../shared/models/question'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'

@Injectable()
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
      this.schedule.updateTaskToComplete(task),
      this.schedule.updateTaskToReportedCompletion(task),
      getTaskType(task) == TaskType.NON_CLINICAL
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  processDataAndSend(answers, questions, timestamps, task) {
    // NOTE: Do not send answers if demo questionnaire
    if (task.isDemo) return Promise.resolve()
    return this.sendAnswersToKafka(
      this.processQuestionnaireData(answers, timestamps, questions),
      task
    )
  }

  sendAnswersToKafka(processedAnswers, task): Promise<any> {
    // NOTE: Submit data to kafka
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

  evalClinicalFollowUpTask(assessment): Promise<any> {
    return this.schedule
      .generateClinicalSchedule(assessment, Date.now())
      .then(() => this.config.rescheduleNotifications())
  }

  processQuestionnaireData(answers, timestamps, questions) {
    this.logger.log('Answers to process', answers)
    const values = Object.entries(answers).map(([key, value]) => ({
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
}
