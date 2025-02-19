import { Injectable } from '@angular/core'

import { ConfigService } from '../../../../core/services/config/config.service'
import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { SchemaType } from '../../../../shared/models/kafka'
import { HealthkitDataType, HealthkitFloatDataTypes, HealthkitStringDataTypes } from '../../../../shared/models/health'
import { getMilliseconds } from 'src/app/shared/utilities/time'
import { QuestionnaireProcessorService } from './questionnaire-processor.service'

@Injectable({
  providedIn: 'root'
})
export class HealthQuestionnaireProcessorService extends QuestionnaireProcessorService {
  constructor(
    schedule: ScheduleService,
    kafka: KafkaService
  ) {
    super(schedule, kafka)
  }
  HEALTHKIT_QUERY_INTERVAL = 100

  process(data, task, assessmentMetadata) {
    const type = SchemaType.HEALTHKIT
    this.updateTaskToComplete(task)
    const dividedObjects = []
    Object.entries(data.answers)
      .filter(([key, _]) => this.isValidDataType(key as HealthkitDataType))
      .forEach(([key, value]) => {
        const startTime = value['startTime']
        const endTime = value['endTime']
        const durationInDays = this.calculateDurationInDays(startTime, endTime)
        if (durationInDays <= this.HEALTHKIT_QUERY_INTERVAL) {
          dividedObjects.push({
            time: data.time,
            timeCompleted: data.timeCompleted,
            key,
            value
          })
        } else {
          const numberOfObjects = Math.ceil(durationInDays / this.HEALTHKIT_QUERY_INTERVAL)
          const interval = durationInDays / numberOfObjects
          let currentStartTime = startTime.getTime()

          for (let i = 0; i < numberOfObjects; i++) {
            const currentEndTime = new Date(currentStartTime + getMilliseconds({ days: interval }))
            const currentValue = {
              startTime: new Date(currentStartTime),
              endTime: currentEndTime > endTime ? endTime : currentEndTime
            }
            dividedObjects.push({
              time: data.time,
              timeCompleted: data.timeCompleted,
              key,
              value: currentValue
            })
            currentStartTime = currentEndTime.getTime()
          }
        }
      });
    return Promise.all(dividedObjects.map(v => this.kafka.prepareKafkaObjectAndStore(type, v)))
      .then(() => this.kafka.sendAllFromCache())
  }

  calculateDurationInDays(startTime, endTime) {
    return (endTime.getTime() - startTime.getTime()) / getMilliseconds({ days: 1 })
  }

  isValidDataType(key: HealthkitDataType) {
    return HealthkitStringDataTypes.has(key) || HealthkitFloatDataTypes.has(key)
  }
}
