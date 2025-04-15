import { EventEmitter, Injectable } from '@angular/core'

import {
  DefaultAppCreditsBody,
  DefaultAppCreditsTitle,
  DefaultOnDemandAssessmentIcon,
  DefaultPlatformInstance,
  DefaultShowTaskCalendarName,
  DefaultShowTaskInfo,
  DefaultEndPoint
} from '../../../../assets/data/defaultConfig'
import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { RemoteConfigService } from '../../../core/services/config/remote-config.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { ConfigKeys } from '../../../shared/enums/config'
import { AssessmentType } from '../../../shared/models/assessment'
import { Task, TasksProgress } from '../../../shared/models/task'
import {
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch
} from '../../../shared/utilities/time'

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  changeDetectionEmitter: EventEmitter<void> = new EventEmitter<void>()

  constructor(
    private schedule: ScheduleService,
    private questionnaire: QuestionnaireService,
    private remoteConfig: RemoteConfigService
  ) {
    this.schedule.changeDetectionEmitter.subscribe(() => {
      console.log('Changes detected to schedule..')
      this.changeDetectionEmitter.emit()
    })
  }

  init() {
    return this.schedule.isInitialised()
      ? Promise.resolve()
      : this.schedule.init()
  }

  getOnDemandAssessmentIcon() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.ON_DEMAND_ASSESSMENT_ICON,
          DefaultOnDemandAssessmentIcon
        )
      )
  }

  getHasOnDemandTasks() {
    return this.questionnaire.getHasOnDemandAssessments()
  }

  getHasClinicalTasks() {
    return this.questionnaire.getHasClinicalAssessments()
  }

  getTasksOfToday() {
    return this.schedule
      .getTasksForDate(new Date(), AssessmentType.SCHEDULED)
      .then(tasks =>
        tasks.filter(
          t => !this.isTaskExpired(t) || this.wasTaskCompletedToday(t) || this.wasTaskValidToday(t)
        )
      )
  }

  getValidTasksMap(): Promise<Map<number, Task[]>> {
    // This groups the tasks valid for today into a Map, where the key is midnight epoch and the value is an array of tasks
    return this.getTasksOfToday()
      .then(t => t.sort((a, b) => a.timestamp - b.timestamp))
      .then(tasks => {
        const sortedTasks = new Map()
        tasks.forEach(t => {
          const midnight = setDateTimeToMidnightEpoch(new Date(t.timestamp))
          if (sortedTasks.has(midnight)) sortedTasks.get(midnight).push(t)
          else sortedTasks.set(midnight, [t])
        })
        return sortedTasks
      })
  }

  getTaskProgress(): Promise<TasksProgress> {
    return this.getTasksOfToday().then(tasks => ({
      numberOfTasks: tasks.length,
      completedTasks: tasks.filter(d => d.completed).length
    }))
  }

  updateTaskToReportedCompletion(task) {
    this.schedule.updateTaskToReportedCompletion(task)
  }

  isToday(date) {
    return (
      new Date(date).setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0)
    )
  }

  areAllTasksComplete(tasks) {
    return !tasks || tasks.every(t => t.completed || !this.isTaskStartable(t))
  }

  isLastTask(tasks) {
    return tasks.filter(t => this.isTaskStartable(t)).length <= 1
  }

  isTaskStartable(task) {
    // NOTE: This checks if the task timestamp has passed and if task is valid
    return task.timestamp <= new Date().getTime() && !this.isTaskExpired(task)
  }

  isTaskExpired(task) {
    // NOTE: This checks if completion window has passed or task is complete
    return (
      task.timestamp + task.completionWindow < new Date().getTime() ||
      task.completed
    )
  }

  wasTaskCompletedToday(task) {
    return task.completed && this.isToday(task.timeCompleted)
  }

  wasTaskValidToday(task) {
    return this.isToday(task.timestamp)
  }

  /**
   * This function Retrieves the most current next task from a list of tasks.
   * @param tasks : list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  getNextTask(tasks: Task[]): Task | undefined {
    let nextTask: Task = undefined
    if (tasks) {
      const nextTasksNow = tasks.filter(task => this.isTaskStartable(task))
      const isLastTask = this.isLastTask(tasks)
      if (nextTasksNow.length) {
        nextTask = nextTasksNow.sort((a, b) => a.order - b.order)[0]
      } else {
        nextTask = tasks.find(task => !this.isTaskExpired(task))
      }
      if (nextTask) {
        nextTask.isLastTask = isLastTask
      }
    }
    return nextTask
  }

  getCurrentDateMidnight() {
    return setDateTimeToMidnight(new Date())
  }

  getPlatformInstanceName() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.PLATFORM_INSTANCE,
          DefaultPlatformInstance
        )
      )
  }

  getAppCreditsTitle() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.APP_CREDITS_TITLE,
          DefaultAppCreditsTitle
        )
      )
      .then(res => JSON.parse(res))
  }

  getAppCreditsBody() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(ConfigKeys.APP_CREDITS_BODY, DefaultAppCreditsBody)
      )
      .then(res => JSON.parse(res))
  }

  getIsTaskCalendarTaskNameShown() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.SHOW_TASK_CALENDAR_NAME,
          DefaultShowTaskCalendarName
        )
      )
      .then(res => JSON.parse(res))
  }

  getIsTaskInfoShown() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.SHOW_TASK_INFO,
          DefaultShowTaskInfo
        )
      )
      .then(res => JSON.parse(res))
  }

  getPortalReturnUrl() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.get(ConfigKeys.PLATFORM_RETURN_URL)
      )
  }
}
