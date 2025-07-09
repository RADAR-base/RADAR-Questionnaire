import { Injectable } from '@angular/core'
import { Subject, Observable, map } from 'rxjs'

import { ConfigService } from '../../../../core/services/config/config.service'
import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { SchemaType } from '../../../../shared/models/kafka'
import { HealthkitDataType, HealthkitFloatDataTypes, HealthkitStringDataTypes } from '../../../../shared/models/health'
import { getMilliseconds } from 'src/app/shared/utilities/time'
import { QuestionnaireProcessorService } from './questionnaire-processor.service'
import { LogService } from '../../../../core/services/misc/log.service'

interface ProcessingProgress {
  stage: 'validation' | 'processing' | 'compression' | 'complete'
  progress: number
  total: number
}

@Injectable({
  providedIn: 'root'
})
export class HealthQuestionnaireProcessorService extends QuestionnaireProcessorService {
  private progressSubject = new Subject<ProcessingProgress>()
  progress$ = this.progressSubject.asObservable()
  HEALTHKIT_QUERY_INTERVAL = 100

  constructor(
    schedule: ScheduleService,
    kafka: KafkaService,
    private logger: LogService
  ) {
    super(schedule, kafka)
  }

  process(data, task, assessmentMetadata): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof Worker !== 'undefined') {
        const worker = new Worker('assets/workers/processor.worker.ts')

        worker.onmessage = ({ data: result }) => {
          if (result.type === 'progress') {
            this.progressSubject.next(result.data)
            return
          }

          if (result.type === 'complete' && result.success) {
            const { kafkaObjects } = result.data

            // Update task completion status
            this.updateTaskToComplete(task)
              .then(() => {
                // Process Kafka objects in batches
                const batchSize = 10
                const processBatch = (startIndex: number): Promise<void> => {
                  const endIndex = Math.min(startIndex + batchSize, kafkaObjects.length)
                  const batch = kafkaObjects.slice(startIndex, endIndex)

                  if (batch.length === 0) {
                    return Promise.resolve()
                  }

                  return Promise.all(
                    batch.map(obj => this.kafka.prepareKafkaObjectAndStore(obj.type, obj.value))
                  ).then(() => {
                    if (endIndex < kafkaObjects.length) {
                      return processBatch(endIndex)
                    }
                  })
                }

                // Process all batches
                return processBatch(0)
                  .then(() => this.kafka.sendAllFromCache())
                  .then(() => {
                    // Ensure progress reaches 100% before resolving
                    this.progressSubject.next({ stage: 'complete', progress: 1, total: 1 })
                    worker.terminate()
                    resolve()
                  })
              })
              .catch(error => {
                worker.terminate()
                this.logger.error('Failed to update task completion', error)
                reject(error)
              })
          } else if (result.type === 'error') {
            worker.terminate()
            this.logger.error('Worker processing failed', result.error)
            reject(new Error(result.error))
          }
        }

        worker.onerror = error => {
          worker.terminate()
          this.logger.error('Worker error', error)
          reject(error)
        }

        // Send data to worker
        worker.postMessage({
          type: 'health',
          task,
          healthData: data,
          assessmentMetadata
        })
      } else {
        // Fallback to synchronous processing if Web Workers are not supported
        this.logger.log('Web Workers not supported, falling back to synchronous processing')
        const type = SchemaType.HEALTHKIT

        // Report progress for synchronous processing
        this.progressSubject.next({ stage: 'processing', progress: 0, total: 1 })

        const dividedObjects = this.processHealthDataSync(data)

        return this.updateTaskToComplete(task)
          .then(() => Promise.all(dividedObjects.map(v => this.kafka.prepareKafkaObjectAndStore(type, v))))
          .then(() => this.kafka.sendAllFromCache())
          .then(() => {
            // Ensure progress reaches 100% before resolving
            this.progressSubject.next({ stage: 'complete', progress: 1, total: 1 })
            resolve()
          })
          .catch(error => {
            this.logger.error('Synchronous processing failed', error)
            reject(error)
          })
      }
    })
  }

  private processHealthDataSync(data) {
    const dividedObjects = []
    const validEntries = Object.entries(data.answers)
      .filter(([key, _]) => this.isValidDataType(key as HealthkitDataType))

    validEntries.forEach(([key, value]) => {
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
    })

    return dividedObjects
  }

  calculateDurationInDays(startTime, endTime) {
    return (endTime.getTime() - startTime.getTime()) / getMilliseconds({ days: 1 })
  }

  isValidDataType(key: HealthkitDataType) {
    return HealthkitStringDataTypes.has(key) || HealthkitFloatDataTypes.has(key)
  }
}
