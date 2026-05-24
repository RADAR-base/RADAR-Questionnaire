import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'
import { ConfigKeys } from 'src/app/shared/enums/config'
import { DefaultEventNameTarget } from 'src/assets/data/defaultConfig'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'
import { KeyConverterService } from './key-converter.service'
import { RemoteConfigService } from '../../config/remote-config.service'

@Injectable()
export class AssessmentConverterService extends ConverterService {
  GENERAL_TOPIC: string = 'questionnaire_response'
  EVENT_NAME_TARGET = DefaultEventNameTarget
  EVENT_NAME_TARGET_NAME = 'name'
  EVENT_NAME_TARGET_METADATA = 'metadata'

  constructor(
    logger: LogService,
    http: HttpClient,
    token: TokenService,
    keyConverter: KeyConverterService,
    private assessmentRemoteConfig: RemoteConfigService
  ) {
    super(logger, http, token, keyConverter, assessmentRemoteConfig)
    this.updateEventNameTarget()
  }

  processData(payload) {
    const task = payload.task
    if (!task) return {}
    const metadata = payload.metadata || {}
    const computedEventName =
      metadata.computedEventName ||
      metadata.renderedEventName
    const data = payload.data
    const processedAnswers = this.processAnswers(data.answers, data.timestamps)
    const name = this.resolveQuestionnaireName(task.name, computedEventName)
    const Answer: AnswerValueExport = {
      name,
      version: 'version',
      answers: processedAnswers,
      time: data.time,
      timeCompleted: data.timeCompleted,
      timeNotification: getSeconds({ milliseconds: task.timestamp })
    }
    if (this.shouldStoreRenderedNameInMetadata() && computedEventName) {
      ; (Answer as any).metadata = { eventName: computedEventName }
    }
    return Answer
  }

  private resolveQuestionnaireName(taskName: string, computedEventName: string) {
    if (this.shouldStoreRenderedNameInMetadata()) return taskName
    return computedEventName || taskName
  }

  private shouldStoreRenderedNameInMetadata() {
    return this.EVENT_NAME_TARGET === this.EVENT_NAME_TARGET_METADATA
  }

  private updateEventNameTarget() {
    return this.assessmentRemoteConfig
      .read()
      .then(config =>
        config.getOrDefault(ConfigKeys.EVENT_NAME_TARGET, DefaultEventNameTarget)
      )
      .then(value => (this.EVENT_NAME_TARGET = (value || '').toLowerCase()))
      .catch(e => this.logger.error('Failed to fetch event_name_target config', e))
  }

  processAnswers(answers, timestamps) {
    this.logger.log('Answers to process', answers)
    const values = Object.entries(answers).map(([key, value]) => ({
      questionId: key.toString(),
      value: value.toString(),
      startTime: timestamps[key].startTime,
      endTime: timestamps[key].endTime
    }))
    return values
  }

  getKafkaTopic(payload, topics): Promise<any> {
    const name = payload.name
    return this.getKafkaTopicFromSpecifications(name).then(specTopic => {
      if (this.topicExists(specTopic, topics)) {
        return Promise.resolve(specTopic)
      }
      const defaultTopic = this.GENERAL_TOPIC
      if (this.topicExists(defaultTopic, topics)) {
        return Promise.resolve(defaultTopic)
      }
      return Promise.resolve('questionnaire_response')
    })
  }
}
