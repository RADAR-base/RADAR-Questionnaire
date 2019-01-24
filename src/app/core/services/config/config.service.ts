import { Injectable } from '@angular/core'

import { DefaultNotificationRefreshTime } from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { setDateTimeToMidnight } from '../../../shared/utilities/time'
import { Utility } from '../../../shared/utilities/util'
import { NotificationService } from '../notifications/notification.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { ProtocolService } from './protocol.service'
import { QuestionnaireService } from './questionnaire.service'

@Injectable()
export class ConfigService {
  constructor(
    public storage: StorageService,
    private schedule: ScheduleService,
    private notifications: NotificationService,
    private util: Utility,
    private protocol: ProtocolService,
    private questionnaire: QuestionnaireService
  ) {}

  fetchConfigState(force?: boolean) {
    return Promise.all([
      this.checkProtocolChange(),
      this.checkTimezoneChange(),
      this.checkNotificationsExpired()
    ]).then(([newProtocol, newTimezone, newNotifications]) => {
      if (newProtocol || force)
        return this.updateConfigStateOnProtocolChange(newProtocol)
      if (newTimezone)
        return this.updateConfigStateOnTimezoneChange(
          newTimezone.prevUtcOffset,
          newTimezone.utcOffset
        )
      if (newNotifications) return this.rescheduleNotifications(false)
    })
  }

  checkProtocolChange() {
    return Promise.all([
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.SCHEDULE_VERSION),
      this.protocol.pull()
    ])
      .then(([configVersion, scheduleVersion, protocol]) => {
        const parsedProtocol = JSON.parse(protocol)
        if (
          configVersion !== parsedProtocol.version ||
          scheduleVersion !== parsedProtocol.version
        )
          return parsedProtocol
        else return null
      })
      .catch(() => {
        Promise.reject({ message: 'No response from server' })
        return null
      })
  }

  checkTimezoneChange() {
    return this.storage.get(StorageKeys.UTC_OFFSET).then(prevUtcOffset => {
      const utcOffset = new Date().getTimezoneOffset()
      // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
      if (prevUtcOffset !== utcOffset) {
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

  checkNotificationsExpired() {
    // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
    return this.storage
      .get(StorageKeys.LAST_NOTIFICATION_UPDATE)
      .then(lastUpdate => {
        const timeElapsed = Date.now() - lastUpdate
        if (timeElapsed > DefaultNotificationRefreshTime || !lastUpdate) {
          return true
        } else {
          return false
        }
      })
  }

  updateConfigStateOnProtocolChange(protocol) {
    const assessments = this.protocol.format(protocol.protocols)
    const {
      negative: scheduledAssessments,
      positive: clinicalAssessments
    } = this.util.partition(assessments, a => a.protocol.clinicalProtocol)
    this.storage.set(
      StorageKeys.HAS_CLINICAL_TASKS,
      clinicalAssessments.length > 0
    )
    return Promise.all([
      this.storage.set(StorageKeys.CONFIG_VERSION, protocol.version),
      this.questionnaire.updateAssessments(
        StorageKeys.CONFIG_CLINICAL_ASSESSMENTS,
        clinicalAssessments
      ),
      this.questionnaire.updateAssessments(
        StorageKeys.CONFIG_ASSESSMENTS,
        scheduledAssessments
      )
    ]).then(() => this.regenerateSchedule())
  }

  updateConfigStateOnLanguageChange() {
    return this.questionnaire
      .pullQuestionnaires(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
      .then(() =>
        this.questionnaire.pullQuestionnaires(StorageKeys.CONFIG_ASSESSMENTS)
      )
      .then(() => this.rescheduleNotifications(true))
  }

  updateConfigStateOnTimezoneChange(prevUtcOffset, utcOffset) {
    // NOTE: Update midnight to time zone of reference date.
    return this.storage
      .get(StorageKeys.ENROLMENTDATE)
      .then(enrolmentDate =>
        this.storage.set(
          StorageKeys.REFERENCEDATE,
          setDateTimeToMidnight(new Date(enrolmentDate)).getTime()
        )
      )
      .then(() => this.storage.set(StorageKeys.UTC_OFFSET, utcOffset))
      .then(() => this.storage.set(StorageKeys.UTC_OFFSET_PREV, prevUtcOffset))
      .then(() => this.regenerateSchedule())
  }

  rescheduleNotifications(cancel?: boolean) {
    return cancel
      ? this.notifications.cancel()
      : Promise.resolve()
          .then(() => this.notifications.publish())
          .then(() =>
            console.log('NOTIFICATIONS scheduled after config change')
          )
  }

  regenerateSchedule() {
    return this.schedule
      .generateSchedule()
      .then(() => this.rescheduleNotifications(true))
  }

  migrateToLatestVersion() {
    // NOTE: Migrate ENROLMENTDATE (from V0.3.1- to V0.3.2+)
    const enrolmentDate = this.storage.get(StorageKeys.ENROLMENTDATE)
    const referenceDate = this.storage.get(StorageKeys.REFERENCEDATE)
    Promise.all([enrolmentDate, referenceDate]).then(dates => {
      if (dates[0] === undefined) {
        this.storage.set(StorageKeys.ENROLMENTDATE, referenceDate)
      }
    })
  }
}
