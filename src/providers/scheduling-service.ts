import { Injectable } from '@angular/core';
import { StorageService } from './storage-service'
import { StorageKeys } from '../enums/storage'
import { Assessment } from '../models/assessment'
import { Task } from '../models/task'
import { ReportScheduling } from '../models/report'
import { Protocol, Reminders, RepeatProtocol } from '../models/protocol'
import { DefaultScheduleYearCoverage } from '../assets/data/defaultConfig'
import { DefaultScheduleReportRepeat } from '../assets/data/defaultConfig'
import 'rxjs/add/operator/map';

@Injectable()
export class SchedulingService {

  scheduleVersion: number
  configVersion: number
  refTimestamp: number
  schedule: Task[]
  upToDate: Promise<Boolean>
  assessments: Promise<Assessment[]>
  tzOffset: number

  constructor(private storage: StorageService) {
    let now = new Date()
    this.tzOffset = now.getTimezoneOffset()
  }

  getNextTask () {
    return this.getTasks().then((schedule) => {
      let timestamp = Date.now()
      var nextIdx = 0
      var nextTimestamp = timestamp * 2
      for(var i = 0; i < schedule.length; i++){
        if(schedule[i].timestamp >= timestamp &&
            schedule[i].timestamp < nextTimestamp){
          nextTimestamp = schedule[i].timestamp
          nextIdx = i
        }
      }
      return schedule[nextIdx]
    })
  }

  getTasksForDate (date) {
    return this.getTasks().then((schedule) => {
      let startDate = this.setDateTimeToMidnight(date)
      let endDate = this.advanceRepeat(startDate, 'day', 1)
      var tasks: Task[] = []
      for(var i = 0; i < schedule.length; i++){
        if(schedule[i].timestamp < endDate.getTime() &&
          schedule[i].timestamp > startDate.getTime()) {
            tasks.push(schedule[i])
          }
      }
      return tasks
    })
  }

  getTasks () {
    var schedule = this.storage.get(StorageKeys.SCHEDULE_TASKS)
    return Promise.resolve(schedule)
  }

  getCurrentReport () {
    return this.getReports().then((reports) => {
      let now = new Date()
      var delta = DefaultScheduleReportRepeat+1
      var idx = 0
      for(var i = 0; i<reports.length; i++){
        let tmpDelta = now.getTime() - reports[i]['timestamp']
        if(tmpDelta < delta && tmpDelta >= 0){
          delta = tmpDelta
          idx = i
        }
      }
      return reports[idx]
    })
  }

  getReports () {
    var schedule = this.storage.get(StorageKeys.SCHEDULE_REPORT)
    return Promise.resolve(schedule)
  }

  updateReport (updatedReport) {
    this.getReports().then((reports) => {
      var updatedReports = reports
      updatedReports[updatedReport['index']] = updatedReport
      this.setReportSchedule(updatedReports)
    })
  }

  generateSchedule () {
    var scheduleVProm= this.storage.get(StorageKeys.SCHEDULE_VERSION)
    var configVProm = this.storage.get(StorageKeys.CONFIG_VERSION)
    var refDate = this.storage.get(StorageKeys.REFERENCEDATE)

    Promise.all([scheduleVProm, configVProm, refDate]).then((data) => {
      this.scheduleVersion = data[0]
      this.configVersion = data[1]
      this.refTimestamp = data[2]

      if(data[0] != data[1]){
        console.log('Updating schedule..')
        this.runScheduler()
      }
    })
  }

  runScheduler () {
    this.getAssessments()
    .then((assessments) => this.buildTaskSchedule(assessments))
    .then((schedule) => this.setSchedule(schedule))
    this.buildReportSchedule()
    .then((schedule) => this.setReportSchedule(schedule))
  }

  getAssessments () {
    var assessments = this.storage.get(StorageKeys.CONFIG_ASSESSMENTS)
    return assessments
  }

  buildTaskSchedule (assessments) {
    var schedule: Task[] = []
    for(var i = 0; i < assessments.length; i++){
      let tmpSchedule = this.buildTasksForSingleAssessment(assessments[i])
      schedule = schedule.concat(tmpSchedule)
    }
    console.log('[√] Updated task schedule.')
    return Promise.resolve(schedule)
  }

  buildTasksForSingleAssessment (assessment) {
    let repeatP = assessment.protocol.repeatProtocol
    let repeatQ = assessment.protocol.repeatQuestionnaire

    var iterDate = new Date(this.refTimestamp)
    let yearsMillis = DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
    let endDate  = new Date(this.refTimestamp + yearsMillis)

    var tmpSchedule: Task[] = []
    while(iterDate.getTime() <= endDate.getTime()){
      iterDate = this.setDateTimeToMidnight(iterDate)
      iterDate = this.advanceRepeat(iterDate, repeatP.unit, repeatP.amount)
      for(var i = 0; i < repeatQ.unitsFromZero.length; i++){
        let taskDate = this.advanceRepeat(iterDate, repeatQ.unit, repeatQ.unitsFromZero[i])
        tmpSchedule.push(this.taskBuilder(assessment, taskDate))
      }
    }
    return tmpSchedule
  }

  setDateTimeToMidnight (date) {
    var resetDate: Date
    if(this.tzOffset = date.getTimezoneOffset()) {
      resetDate = new Date(date.setHours(1,0,0,0))
    } else {
      resetDate = new Date(date.setHours(0,0,0,0))
    }
    this.tzOffset = date.getTimezoneOffset()
    return resetDate
  }

  advanceRepeat (date, unit, multiplier) {
    var returnDate = new Date(date.getTime())
    switch(unit){
      case 'min':
        returnDate = new Date(date.getTime() + multiplier * 60000)
        break
      case 'hour':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60)
        break
      case 'day':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60 * 24)
        break
      case 'week':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60 * 24 * 7)
        break
      case 'month':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60 * 24 * 31)
        break
      case 'year':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60 * 24 * 365)
        break
      default:
        returnDate = new Date(date.getTime() + DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365)
        break
    }
    return returnDate
  }

  taskBuilder (assessment, taskDate):Task {
    let task: Task = {
      timestamp: taskDate.getTime(),
      name: assessment.name,
      reminderSettings: assessment.protocol.reminders,
      nQuestions: assessment.questions.length,
      estimatedCompletionTime: assessment.estimatedCompletionTime
    }
    return task
  }

  setSchedule (schedule) {
    this.storage.set(StorageKeys.SCHEDULE_TASKS, schedule)
    this.storage.set(StorageKeys.SCHEDULE_VERSION, this.configVersion)
  }

  buildReportSchedule () {
    var iterDate = new Date(this.refTimestamp)
    iterDate = this.setDateTimeToMidnight(iterDate)
    let yearsMillis = DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
    let endDate  = new Date(this.refTimestamp + yearsMillis)
    var tmpSchedule: ReportScheduling[] = []

    while(iterDate.getTime() <= endDate.getTime()){
      iterDate = this.advanceRepeat(iterDate, 'day', DefaultScheduleReportRepeat)
      let report = this.reportBuilder(tmpSchedule.length, iterDate)
      tmpSchedule.push(report)
    }
    console.log('[√] Updated report schedule.')
    return Promise.resolve(tmpSchedule)
  }

  reportBuilder (index, reportDate):ReportScheduling {
    let report = {
      'index': index,
      'timestamp': reportDate.getTime(),
      'viewed': false,
      'firstViewedOn': 0,
      range: {
        'timestampStart':reportDate.getTime() - DefaultScheduleReportRepeat * 60000 * 60 * 24,
        'timestampEnd':reportDate.getTime()
      }
    }
    return report
  }

  setReportSchedule (schedule) {
    this.storage.set(StorageKeys.SCHEDULE_REPORT, schedule)
  }
}
