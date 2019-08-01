import { Component, Input, OnChanges } from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { ReportScheduling } from '../../../../shared/models/report'
import { Task } from '../../../../shared/models/task'
import { getHours, getMinutes } from '../../../../shared/utilities/time'

@Component({
  selector: 'ticker-bar',
  templateUrl: 'ticker-bar.component.html'
})
export class TickerBarComponent implements OnChanges {
  @Input()
  task: Task
  @Input()
  isNow
  @Input()
  showAffirmation = false
  @Input()
  noTasksToday = false
  tickerText: string
  report: ReportScheduling

  constructor(private localization: LocalizationService) {}

  ngOnChanges() {
    this.updateTickerItem()
  }

  updateTickerItem() {
    if (!this.tickerText) return this.addTasksRemaining()
    if (this.noTasksToday) return this.addTasksNone()
    if (this.showAffirmation) return this.addAffirmation()
    if (this.task) return this.addTask()
    if (this.report) return this.addReportAvailable()
  }

  addReportAvailable() {
    if (this.report) {
      if (this.report['viewed'] === false) {
        this.tickerText = '<b>Report available!</b> Click to view.'
      }
    }
  }

  addTask() {
    if (this.isNow) {
      this.tickerText =
        this.localization.translateKey(LocKeys.TASK_BAR_NOW_TASK) +
        '<b>' +
        this.localization.translateKey(LocKeys.STATUS_NOW) +
        '.</b>'
    } else {
      if (this.task.name === 'ESM') {
        this.tickerText =
          this.localization.translateKey(LocKeys.TASK_BAR_NOW_TASK) +
          '<b>' +
          this.localization.translateKey(LocKeys.TASK_BAR_NEXT_TASK_SOON) +
          '.</b>'
      } else {
        this.tickerText =
          this.localization.translateKey(LocKeys.TASK_BAR_NEXT_TASK) +
          '<b>' +
          this.getTimeToNext(this.task.timestamp) +
          '.</b>'
      }
    }
  }

  addAffirmation() {
    this.tickerText =
      '<b>' +
      this.localization.translateKey(LocKeys.TASK_BAR_AFFIRMATION_1) +
      '</b> ' +
      this.localization.translateKey(LocKeys.TASK_BAR_AFFIRMATION_2)
  }

  addTasksRemaining() {
    this.tickerText =
      '<b>' +
      this.localization.translateKey(LocKeys.TASK_BAR_TASK_LEFT_1) +
      '</b>' +
      this.localization.translateKey(LocKeys.TASK_BAR_TASK_LEFT_2)
  }

  addTasksNone() {
    this.tickerText =
      '<b>' +
      this.localization.translateKey(LocKeys.TASK_BAR_NO_TASK_1) +
      ' </b>' +
      this.localization.translateKey(LocKeys.TASK_BAR_NO_TASK_2)
  }

  getTimeToNext(next) {
    const now = new Date().getTime()
    let deltaStr = ''
    const deltaMin = Math.round(getMinutes({ milliseconds: next - now }))
    const deltaHour = Math.round(getHours({ minutes: deltaMin }))
    if (deltaMin > 59) {
      deltaStr =
        String(deltaHour) +
        ' ' +
        (deltaHour > 1
          ? this.localization.translateKey(LocKeys.TASK_TIME_HOUR_MULTIPLE)
          : this.localization.translateKey(LocKeys.TASK_TIME_HOUR_SINGLE))
    } else {
      deltaStr =
        String(deltaMin) +
        ' ' +
        (deltaMin > 1
          ? this.localization.translateKey(LocKeys.TASK_TIME_MINUTE_MULTIPLE)
          : this.localization.translateKey(LocKeys.TASK_TIME_MINUTE_SINGLE))
    }
    return deltaStr
  }
}
