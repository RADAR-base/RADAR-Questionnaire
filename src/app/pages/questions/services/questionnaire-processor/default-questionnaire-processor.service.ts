import { Injectable } from '@angular/core'
import { Subject, Observable, map } from 'rxjs'

import { ConfigService } from '../../../../core/services/config/config.service'
import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { SchemaType } from '../../../../shared/models/kafka'
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
export class DefaultQuestionnaireProcessorService extends QuestionnaireProcessorService {
  private progressSubject = new Subject<ProcessingProgress>();
  progress$ = this.progressSubject.asObservable();

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
        const worker = new Worker('assets/workers/processor.worker.js')

        worker.onmessage = ({ data: result }) => {
          if (result.type === 'progress') {
            this.progressSubject.next(result.data);
            return;
          }

          if (result.type === 'complete' && result.success) {
            const { kafkaObjects } = result.data

            // Update task completion status
            this.updateTaskToComplete(task)
              .then(() => {
                // Process Kafka objects in batches
                const batchSize = 10;
                const processBatch = (startIndex: number): Promise<void> => {
                  const endIndex = Math.min(startIndex + batchSize, kafkaObjects.length);
                  const batch = kafkaObjects.slice(startIndex, endIndex);

                  if (batch.length === 0) {
                    return Promise.resolve();
                  }

                  return Promise.all(
                    batch.map(obj => this.kafka.prepareKafkaObjectAndStore(obj.type, obj.value))
                  ).then(() => {
                    if (endIndex < kafkaObjects.length) {
                      return processBatch(endIndex);
                    }
                  });
                };

                // Process all batches
                return processBatch(0)
                  .then(() => this.kafka.sendAllFromCache())
                  .then(() => {
                    // Ensure progress reaches 100% before resolving
                    this.progressSubject.next({ stage: 'complete', progress: 1, total: 1 });
                    worker.terminate();
                    resolve();
                  });
              })
              .catch(error => {
                worker.terminate();
                this.logger.error('Failed to update task completion', error);
                reject(error);
              });
          } else if (result.type === 'error') {
            worker.terminate();
            this.logger.error('Worker processing failed', result.error);
            reject(new Error(result.error));
          }
        }

        worker.onerror = error => {
          worker.terminate();
          this.logger.error('Worker error', error);
          reject(error);
        }

        // Send data to worker
        worker.postMessage({
          type: 'questionnaire',
          task,
          questionnaireData: data,
          assessmentMetadata
        });
      } else {
        // Fallback to synchronous processing if Web Workers are not supported
        this.logger.log('Web Workers not supported, falling back to synchronous processing');
        const type = SchemaType.ASSESSMENT;

        // Report progress for synchronous processing
        this.progressSubject.next({ stage: 'processing', progress: 0, total: 1 });

        const kafkaObjects = this.processQuestionnaireDataSync(data);

        return this.updateTaskToComplete(task)
          .then(() => Promise.all(kafkaObjects.map(v => this.kafka.prepareKafkaObjectAndStore(type, v))))
          .then(() => this.kafka.sendAllFromCache())
          .then(() => {
            // Ensure progress reaches 100% before resolving
            this.progressSubject.next({ stage: 'complete', progress: 1, total: 1 });
            resolve();
          })
          .catch(error => {
            this.logger.error('Synchronous processing failed', error);
            reject(error);
          });
      }
    });
  }

  private processQuestionnaireDataSync(data) {
    const kafkaObjects = [];
    const validEntries = Object.entries(data.answers);

    validEntries.forEach(([key, value]) => {
      kafkaObjects.push({
        time: data.time,
        timeCompleted: data.timeCompleted,
        key,
        value
      });
    });

    return kafkaObjects;
  }
}
