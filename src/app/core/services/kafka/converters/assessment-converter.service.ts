import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'
import { RemoteConfigService } from '../../config/remote-config.service'

@Injectable()
export class AssessmentConverterService extends ConverterService {
  GENERAL_TOPIC: string = 'questionnaire_response'

  constructor(logger: LogService, http: HttpClient, token: TokenService, remoteConfig: RemoteConfigService) {
    super(logger, http, token, remoteConfig)
  }

  init() { }

  processData(payload) {
    const task = payload.task
    if (!task) return {}
    const data = payload.data
    const processedAnswers = this.processAnswers(data.answers, data.timestamps)
    const Answer: AnswerValueExport = {
      name: task.name,
      version: 'version',
      answers: processedAnswers,
      time: data.time,
      timeCompleted: data.timeCompleted,
      timeNotification: getSeconds({ milliseconds: task.timestamp })
    }
    return Answer
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
      const questionnaireTopic = `${payload.avsc}_${payload.name}`
      if (this.topicExists(questionnaireTopic, topics)) {
        return Promise.resolve(questionnaireTopic)
      }
      const defaultTopic = this.GENERAL_TOPIC
      if (this.topicExists(defaultTopic, topics)) {
        return Promise.resolve(defaultTopic)
      }
      return Promise.resolve('questionnaire_response')
    })
  }
}
