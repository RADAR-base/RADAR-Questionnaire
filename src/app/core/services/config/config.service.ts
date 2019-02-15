import { Injectable } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version/ngx'

import {
  DefaultNotificationRefreshTime,
  DefaultScheduleVersion,
  DefaultSettingsNotifications,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { TaskType } from '../../../shared/utilities/task-type'
import { setDateTimeToMidnight } from '../../../shared/utilities/time'
import { KafkaService } from '../kafka/kafka.service'
import { LocalizationService } from '../misc/localization.service'
import { NotificationService } from '../notifications/notification.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { FirebaseAnalyticsService } from '../usage/firebaseAnalytics.service'
import { ProtocolService } from './protocol.service'
import { QuestionnaireService } from './questionnaire.service'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ConfigService {
  private readonly CONFIG_STORE = {
    CONFIG_VERSION: StorageKeys.CONFIG_VERSION,
    SCHEDULE_VERSION: StorageKeys.SCHEDULE_VERSION,
    APP_VERSION: StorageKeys.APP_VERSION,
    UTC_OFFSET: StorageKeys.UTC_OFFSET,
    UTC_OFFSET_PREV: StorageKeys.UTC_OFFSET_PREV,
    REFERENCEDATE: StorageKeys.REFERENCEDATE,
    SETTINGS_NOTIFICATIONS: StorageKeys.SETTINGS_NOTIFICATIONS,
    SETTINGS_WEEKLYREPORT: StorageKeys.SETTINGS_WEEKLYREPORT
  }

  constructor(
    public storage: StorageService,
    private schedule: ScheduleService,
    private notifications: NotificationService,
    private protocol: ProtocolService,
    private questionnaire: QuestionnaireService,
    private appVersion: AppVersion,
    private subjectConfig: SubjectConfigService,
    private kafka: KafkaService,
    private localization: LocalizationService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {}

  init() {
    return Promise.all([
      this.setNotificationSettings(DefaultSettingsNotifications),
      this.setReportSettings(DefaultSettingsWeeklyReport),
      this.setAppVersion(),
      this.setScheduleVersion(DefaultScheduleVersion),
      this.setUTCOffset(new Date().getTimezoneOffset()),
      this.setReferenceDate()
    ])
  }

  fetchConfigState(force?: boolean) {
    return Promise.all([
      this.checkProtocolChange(force),
      this.checkAppVersionChange(),
      this.checkTimezoneChange(),
      this.checkNotificationsExpired()
    ]).then(([newProtocol, newAppVersion, newTimezone, newNotifications]) => {
      if (newProtocol)
        return this.updateConfigStateOnProtocolChange(newProtocol)
      if (newAppVersion) return this.updateConfigStateOnAppVersionChange()
      if (newTimezone)
        return this.updateConfigStateOnTimezoneChange(newTimezone)
      if (newNotifications) return this.rescheduleNotifications(false)
    })
  }

  checkProtocolChange(force?) {
    return Promise.all([
      this.getConfigVersion(),
      this.getScheduleVersion(),
      this.protocol.pull()
    ])
      .then(([configVersion, scheduleVersion, protocol]) => {
        const parsedProtocol = JSON.parse(protocol)
        console.log(parsedProtocol)
        if (
          configVersion !== parsedProtocol.version ||
          scheduleVersion !== parsedProtocol.version ||
          force
        ) {
          this.firebaseAnalytics.logEvent('protocol_change', {
            prev_version: configVersion,
            new_version: parsedProtocol.version
          })
          return parsedProtocol
        }
      })
      .catch(() => Promise.reject({ message: 'No response from server' }))
  }

  checkTimezoneChange() {
    return this.getUTCOffset().then(prevUtcOffset => {
      const utcOffset = new Date().getTimezoneOffset()
      // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
      if (prevUtcOffset !== utcOffset) {
        this.firebaseAnalytics.logEvent('timezone_change', {
          prev_version: String(prevUtcOffset),
          new_version: String(utcOffset)
        })
        console.log(
          '[SPLASH] Timezone has changed to ' +
            utcOffset +
            '. Cancelling notifications! Rescheduling tasks! Scheduling new notifications!'
        )
        return { prevUtcOffset, utcOffset }
      } else {
        console.log('[SPLASH] Current Timezone is ' + utcOffset)
        return null
      }
    })
  }

  checkAppVersionChange() {
    return Promise.all([
      this.getAppVersion(),
      this.appVersion.getVersionNumber()
    ]).then(([storedAppVersion, appVersion]) => {
      if (storedAppVersion !== appVersion) {
        this.firebaseAnalytics.logEvent('app_version_change', {
          prev_version: String(storedAppVersion),
          new_version: String(appVersion)
        })
        return appVersion
      }
    })
  }

  checkNotificationsExpired() {
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
    console.log(assessments)
    return Promise.all([
      this.setConfigVersion(protocol.version),
      this.questionnaire.updateAssessments(TaskType.ALL, assessments)
    ])
      .then(() => this.regenerateSchedule())
      .then(() => this.setScheduleVersion(protocol.version))
  }

  updateConfigStateOnLanguageChange() {
    return Promise.all([
      this.questionnaire.pullQuestionnaires(TaskType.CLINICAL),
      this.questionnaire.pullQuestionnaires(TaskType.NON_CLINICAL)
    ]).then(() => this.rescheduleNotifications(true))
  }

  updateConfigStateOnAppVersionChange() {
    return this.setAppVersion().then(() => this.regenerateSchedule())
  }

  updateConfigStateOnTimezoneChange({ prevUtcOffset, utcOffset }) {
    // NOTE: Update midnight to time zone of reference date.
    return this.setReferenceDate()
      .then(() => this.setUTCOffset(utcOffset))
      .then(() => this.setPrevUTCOffset(prevUtcOffset))
      .then(() => this.regenerateSchedule())
  }

  rescheduleNotifications(cancel?: boolean) {
    return (cancel ? this.notifications.cancel() : Promise.resolve())
      .then(() => this.notifications.publish())
      .then(() => console.log('NOTIFICATIONS scheduled after config change'))
      .then(() =>
        this.firebaseAnalytics.logEvent('notification_rescheduled', {})
      )
  }

  regenerateSchedule() {
    return Promise.all([this.getReferenceDate(), this.getPrevUTCOffset()])
      .then(([refDate, prevUTCOffset]) =>
        this.schedule.generateSchedule(refDate, prevUTCOffset)
      )
      .then(() => this.rescheduleNotifications(true))
  }

  getAppVersion() {
    return this.storage.get(this.CONFIG_STORE.APP_VERSION)
  }

  getConfigVersion() {
    return this.storage.get(this.CONFIG_STORE.CONFIG_VERSION)
  }

  getScheduleVersion() {
    return this.storage.get(this.CONFIG_STORE.SCHEDULE_VERSION)
  }

  getNotificationSettings() {
    return this.storage.get(this.CONFIG_STORE.SETTINGS_NOTIFICATIONS)
  }

  getReportSettings() {
    return this.storage.get(this.CONFIG_STORE.SETTINGS_WEEKLYREPORT)
  }

  getUTCOffset() {
    return this.storage.get(this.CONFIG_STORE.UTC_OFFSET)
  }

  getPrevUTCOffset() {
    return this.storage.get(this.CONFIG_STORE.UTC_OFFSET_PREV)
  }

  getReferenceDate() {
    return this.storage.get(this.CONFIG_STORE.REFERENCEDATE)
  }

  setNotificationSettings(settings) {
    return this.storage.set(this.CONFIG_STORE.SETTINGS_NOTIFICATIONS, settings)
  }

  setReportSettings(settings) {
    return this.storage.set(this.CONFIG_STORE.SETTINGS_WEEKLYREPORT, settings)
  }

  setAppVersion() {
    return this.appVersion
      .getVersionNumber()
      .then(version => this.storage.set(this.CONFIG_STORE.APP_VERSION, version))
  }

  setConfigVersion(version) {
    return this.storage.set(this.CONFIG_STORE.CONFIG_VERSION, version)
  }

  setScheduleVersion(version) {
    return this.storage.set(this.CONFIG_STORE.SCHEDULE_VERSION, version)
  }

  setUTCOffset(offset) {
    return this.storage.set(this.CONFIG_STORE.UTC_OFFSET, offset)
  }

  setPrevUTCOffset(offset) {
    return this.storage.set(this.CONFIG_STORE.UTC_OFFSET_PREV, offset)
  }

  setReferenceDate() {
    return this.subjectConfig
      .getEnrolmentDate()
      .then(enrolment =>
        this.storage.set(
          this.CONFIG_STORE.REFERENCEDATE,
          setDateTimeToMidnight(new Date(enrolment)).getTime()
        )
      )
  }

  reset() {
    return this.storage.clearStorage()
  }

  setAll(participantId, participantLogin, projectName, sourceId, createdDate) {
    return Promise.all([
      this.subjectConfig
        .init(
          participantId,
          participantLogin,
          projectName,
          sourceId,
          createdDate
        )
        .then(() =>
          this.firebaseAnalytics.setUserProperties({
            subjectId: participantLogin,
            projectId: projectName,
            sourceId: sourceId,
            enrolmentDate: String(createdDate),
            humanReadableId: participantId
          })
        )
        .then(() => this.init()),
      this.localization.init(),
      this.kafka.init()
    ])
  }

  getAll() {
    return {
      participantID: this.subjectConfig.getParticipantID(),
      projectName: this.subjectConfig.getProjectName(),
      enrolmentDate: this.subjectConfig.getEnrolmentDate(),
      configVersion: this.getConfigVersion(),
      scheduleVersion: this.getScheduleVersion(),
      notificationSettings: this.getNotificationSettings(),
      weeklyReport: this.getReportSettings(),
      appVersion: this.getAppVersion(),
      languagesSelectable: this.localization.getLanguageSettings(),
      language: Promise.resolve(this.localization.getLanguage()),
      cacheSize: this.kafka.getCacheSize(),
      lastUploadDate: this.kafka.getLastUploadDate()
    }
  }
}
