import { Component, Input, OnChanges, OnInit } from '@angular/core'
import { NavController } from 'ionic-angular'

import { SchedulingService } from '../../../../core/services/scheduling.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { ReportScheduling } from '../../../../shared/models/report'
import { Task } from '../../../../shared/models/task'
import { TickerItem } from '../../../../shared/models/ticker'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { ReportPageComponent } from '../../../report/containers/report-page.component'

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
  tickerText: string
  report: ReportScheduling

  constructor(
    private schedule: SchedulingService,
    private navCtrl: NavController,
    private translate: TranslatePipe
  ) {}

  ngOnChanges() {
    this.updateTickerItem()
  }

  openReport() {
    this.updateReport()
    this.updateTickerItem()
    this.navCtrl.push(ReportPageComponent)
  }

  updateReport() {
    if (this.report) {
      const now = new Date()
      this.report['viewed'] = true
      this.report['firstViewedOn'] = now.getTime()
      this.schedule.updateReport(this.report)
    }
  }

  updateTickerItem() {
    if (!this.tickerText) {
      return this.addTasksNone()
    }
    if (this.showAffirmation) {
      return this.addAffirmation()
    }
    if (this.task) {
      return this.addTask()
    }
    if (this.report) {
      return this.addReportAvailable()
    }
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
        this.translate.transform(LocKeys.TASK_BAR_NOW_TASK.toString()) +
        '<b>' +
        this.translate.transform(LocKeys.STATUS_NOW.toString()) +
        '.</b>'
    } else {
      if (this.task.name === 'ESM') {
        this.tickerText =
          this.translate.transform(LocKeys.TASK_BAR_NOW_TASK.toString()) +
          '<b>' +
          this.translate.transform(LocKeys.TASK_BAR_NEXT_TASK_SOON.toString()) +
          '.</b>'
      } else {
        this.tickerText =
          this.translate.transform(LocKeys.TASK_BAR_NEXT_TASK.toString()) +
          '<b>' +
          this.getTimeToNext(this.task.timestamp) +
          '.</b>'
      }
    }
  }

  addAffirmation() {
    this.tickerText =
      '<b>' +
      this.translate.transform(LocKeys.TASK_BAR_AFFIRMATION_1.toString()) +
      '</b>' +
      this.translate.transform(LocKeys.TASK_BAR_AFFIRMATION_2.toString())
  }

  addTasksNone() {
    this.tickerText =
      '<b>' +
      this.translate.transform(LocKeys.TASK_BAR_TASK_LEFT_1.toString()) +
      '</b>' +
      this.translate.transform(LocKeys.TASK_BAR_TASK_LEFT_2.toString())
  }

  getTimeToNext(next) {
    const now = new Date().getTime()
    let deltaStr = ''
    const deltaMin = Math.round((next - now) / 60000)
    const deltaHour = Math.round(deltaMin / 60)
    if (deltaMin > 59) {
      deltaStr =
        String(deltaHour) +
        ' ' +
        (deltaHour > 1
          ? this.translate.transform(LocKeys.TASK_TIME_HOUR_MULTIPLE.toString())
          : this.translate.transform(LocKeys.TASK_TIME_HOUR_SINGLE.toString()))
    } else {
      deltaStr =
        String(deltaMin) +
        ' ' +
        (deltaMin > 1
          ? this.translate.transform(
              LocKeys.TASK_TIME_MINUTE_MULTIPLE.toString()
            )
          : this.translate.transform(
              LocKeys.TASK_TIME_MINUTE_SINGLE.toString()
            ))
    }
    return deltaStr
  }
}
