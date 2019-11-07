import { Injectable } from '@angular/core'

import { DefaultNotificationRefreshTime } from '../../../../assets/data/defaultConfig'
import {
  ConfigEventType,
  NotificationEventType
} from '../../../shared/enums/events'
import { TaskType } from '../../../shared/utilities/task-type'
import { KafkaService } from '../kafka/kafka.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { NotificationService } from '../notifications/notification.service'
import { ScheduleService } from '../schedule/schedule.service'
import { AppConfigService } from './app-config.service'
import { ProtocolService } from './protocol.service'
import { QuestionnaireService } from './questionnaire.service'
import { SubjectConfigService } from './subject-config.service'
import { AnalyticsService } from '../usage/analytics.service'
import { User } from '../../../shared/models/user'

@Injectable()
export class ConfigService {
  constructor(
    private schedule: ScheduleService,
    private notifications: NotificationService,
    private protocol: ProtocolService,
    private questionnaire: QuestionnaireService,
    private appConfig: AppConfigService,
    private subjectConfig: SubjectConfigService,
    private kafka: KafkaService,
    private localization: LocalizationService,
    private analytics: AnalyticsService,
    private logger: LogService
  ) {}

  fetchConfigState(force?: boolean) {
    return Promise.all([
      this.hasProtocolChanged(force),
      this.hasAppVersionChanged(),
      this.hasTimezoneChanged(),
      this.hasNotificationsExpired()
    ])
      .then(([newProtocol, newAppVersion, newTimezone, newNotifications]) => {
        if (newProtocol && newAppVersion && newTimezone)
          this.subjectConfig
            .getEnrolmentDate()
            .then(d => this.appConfig.init(d))
        if (newProtocol)
          return this.updateConfigStateOnProtocolChange(newProtocol)
        if (newAppVersion)
          return this.updateConfigStateOnAppVersionChange(newAppVersion)
        if (newTimezone)
          return this.updateConfigStateOnTimezoneChange(newTimezone)
        if (newNotifications) return this.rescheduleNotifications(false)
      })
      .catch(e => {
        this.sendConfigChangeEvent(ConfigEventType.ERROR)
        throw e
      })
  }

  hasProtocolChanged(force?) {
    return Promise.all([
      this.appConfig.getScheduleVersion(),
      this.protocol.pull()
    ])
      .then(([scheduleVersion, protocol]) => {
        const parsedProtocol = JSON.parse(protocol)
        this.logger.log('Protocol : ', parsedProtocol)
        if (scheduleVersion !== parsedProtocol.version || force) {
          this.sendConfigChangeEvent(
            ConfigEventType.PROTOCOL_CHANGE,
            scheduleVersion,
            parsedProtocol.version
          )
          return parsedProtocol
        }
      })
      .catch(() => {
        throw new Error('No response from server')
      })
  }

  hasTimezoneChanged() {
    return this.appConfig.getUTCOffset().then(prevUtcOffset => {
      const utcOffset = new Date().getTimezoneOffset()
      // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
      if (prevUtcOffset !== utcOffset) {
        this.sendConfigChangeEvent(
          ConfigEventType.TIMEZONE_CHANGE,
          prevUtcOffset,
          utcOffset
        )
        console.log(
          `[SPLASH] Timezone has changed to  ${utcOffset} Refreshing config..`
        )
        return { prevUtcOffset, utcOffset }
      } else {
        console.log(`[SPLASH] Current Timezone is ${utcOffset}`)
        return null
      }
    })
  }

  hasAppVersionChanged() {
    return Promise.all([
      this.appConfig.getStoredAppVersion(),
      this.appConfig.getAppVersion()
    ]).then(([storedAppVersion, appVersion]) => {
      if (storedAppVersion !== appVersion) {
        this.sendConfigChangeEvent(
          ConfigEventType.APP_VERSION_CHANGE,
          storedAppVersion,
          appVersion
        )
        return appVersion
      }
    })
  }

  hasNotificationsExpired() {
    // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
    return this.notifications.getLastNotificationUpdate().then(lastUpdate => {
      const timeElapsed = Date.now() - lastUpdate
      return (
        timeElapsed > DefaultNotificationRefreshTime ||
        !lastUpdate ||
        timeElapsed < 0
      )
    })
  }

  checkParticipantEnrolled() {
    return this.subjectConfig
      .getParticipantLogin()
      .then(participant => (participant ? participant : Promise.reject([])))
  }

  updateConfigStateOnProtocolChange(protocol) {
    const assessments = this.protocol.format(protocol.protocols)
    this.logger.log('Assessments read ', assessments)
    return this.questionnaire
      .updateAssessments(TaskType.ALL, assessments)
      .then(() => this.regenerateSchedule())
      .then(() => this.appConfig.setScheduleVersion(protocol.version))
  }

  updateConfigStateOnLanguageChange() {
    return Promise.all([
      this.questionnaire.pullQuestionnaires(TaskType.CLINICAL),
      this.questionnaire.pullQuestionnaires(TaskType.NON_CLINICAL)
    ]).then(() => this.rescheduleNotifications(true))
  }

  updateConfigStateOnAppVersionChange(version) {
    return this.appConfig
      .setAppVersion(version)
      .then(() => this.regenerateSchedule())
  }

  updateConfigStateOnTimezoneChange({ prevUtcOffset, utcOffset }) {
    // NOTE: Update midnight to time zone of reference date.
    return this.subjectConfig
      .getEnrolmentDate()
      .then(enrolment => this.appConfig.setReferenceDate(enrolment))
      .then(() => this.appConfig.setUTCOffset(utcOffset))
      .then(() => this.appConfig.setPrevUTCOffset(prevUtcOffset))
      .then(() => this.regenerateSchedule())
  }

  rescheduleNotifications(cancel?: boolean) {
    return (cancel ? this.cancelNotifications() : Promise.resolve())
      .then(() => this.notifications.publish())
      .then(() => console.log('NOTIFICATIONS scheduled after config change'))
      .then(() =>
        cancel
          ? this.sendConfigChangeEvent(NotificationEventType.RESCHEDULED)
          : this.sendConfigChangeEvent(NotificationEventType.REFRESHED)
      )
      .catch(e => {
        throw this.logger.error('Failed to reschedule notifications', e)
      })
  }

  cancelNotifications() {
    this.sendConfigChangeEvent(NotificationEventType.CANCELLED)
    return this.notifications.cancel()
  }

  regenerateSchedule() {
    return Promise.all([
      this.appConfig.getReferenceDate(),
      this.appConfig.getPrevUTCOffset()
    ])
      .then(([refDate, prevUTCOffset]) =>
        this.schedule.generateSchedule(refDate, prevUTCOffset)
      )
      .catch(e => {
        throw this.logger.error('Failed to generate schedule', e)
      })
      .then(() => this.rescheduleNotifications(true))
  }

  resetAll() {
    this.sendConfigChangeEvent(ConfigEventType.APP_RESET)
    return this.subjectConfig.reset()
  }

  resetConfig() {
    this.sendConfigChangeEvent(ConfigEventType.APP_RESET_PARTIAL)
    return Promise.all([
      this.appConfig.reset(),
      this.questionnaire.reset(),
      this.kafka.reset(),
      this.schedule.reset()
    ])
  }

  setAll(user: User) {
    this.logger.log('User info is :', JSON.stringify(user))
    return Promise.all([
      this.subjectConfig
        .init(user)
        .then(() => this.analytics.setUserProperties(user))
        .then(() => this.appConfig.init(user.enrolmentDate)),
      this.localization.init(),
      this.kafka.init()
    ])
  }

  getAll() {
    return {
      participantID: this.subjectConfig.getParticipantID(),
      projectName: this.subjectConfig.getProjectName(),
      enrolmentDate: this.subjectConfig.getEnrolmentDate(),
      scheduleVersion: this.appConfig.getScheduleVersion(),
      notificationSettings: this.appConfig.getNotificationSettings(),
      weeklyReport: this.appConfig.getReportSettings(),
      appVersion: this.appConfig.getAppVersion(),
      languagesSelectable: this.localization.getLanguageSettings(),
      language: Promise.resolve(this.localization.getLanguage()),
      cacheSize: this.kafka.getCacheSize(),
      lastUploadDate: this.kafka.getLastUploadDate()
    }
  }

  sendConfigChangeEvent(type, previous?, current?) {
    this.analytics.logEvent(type, {
      previous: String(previous),
      current: String(current)
    })
  }

  sendTestNotification() {
    this.sendConfigChangeEvent(NotificationEventType.TEST)
    return this.notifications.sendTestNotification()
  }

  updateSettings(settings) {
    // TODO: Fix settings
  }
}
