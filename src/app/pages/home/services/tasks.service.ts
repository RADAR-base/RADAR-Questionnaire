import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { Task, TasksProgress } from '../../../shared/models/task'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'

@Injectable()
export class TasksService {
  constructor(
    private schedule: ScheduleService,
    private localization: LocalizationService,
    private questionnaire: QuestionnaireService
  ) {}

  getQuestionnairePayload(task) {
    const type = getTaskType(task)
    return Promise.all([
      this.questionnaire.getAssessment(type, task),
      this.isLastTask(task)
    ]).then(([assessment, isLastTask]) => {
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        task: task,
        assessment: assessment,
        type: type,
        isLastTask: isLastTask
      }
    })
  }

  evalHasClinicalTasks() {
    return this.questionnaire.getHasClinicalTasks()
  }

  getTasksOfToday() {
    return this.schedule.getTasksForDate(new Date(), TaskType.NON_CLINICAL)
  }

  getSortedTasksOfToday(): Promise<Map<number, Task[]>> {
    return this.getTasksOfToday().then(tasks => {
      const sortedTasks = new Map()
      tasks.forEach(t => {
        const midnight = new Date(t.timestamp).setUTCHours(0, 0, 0, 0)
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

  getIncompleteTasks() {
    return this.schedule.getIncompleteTasks()
  }

  updateTaskToReportedCompletion(task) {
    this.schedule.updateTaskToReportedCompletion(task)
  }

  areAllTasksComplete(tasks) {
    return (
      !tasks ||
      tasks.every(
        t =>
          t.name === 'ESM' ||
          t.isClinical ||
          t.completed ||
          !this.isTaskValid(t)
      )
    )
  }

  isLastTask(task) {
    return this.getTasksOfToday().then(
      tasks =>
        !tasks ||
        tasks.every(
          t => t.name === 'ESM' || t.completed || t.index === task.index
        )
    )
  }

  isTaskValid(task) {
    const now = new Date().getTime()
    return (
      task.timestamp <= now &&
      task.timestamp + task.completionWindow > now &&
      !task.completed
    )
  }

  /**
   * This function Retrieves the most current next task from a list of tasks.
   * @param tasks : list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  getNextTask(tasks: Task[]): Task | undefined {
    if (tasks) {
      const tenMinutesAgo = new Date().getTime() - DefaultESMCompletionWindow
      const offsetForward = DefaultTaskCompletionWindow
      return tasks.find(task => {
        switch (task.name) {
          case 'ESM':
            // NOTE: For ESM, just look from 10 mins before now
            return (
              task.timestamp >= tenMinutesAgo &&
              task.timestamp < tenMinutesAgo + offsetForward &&
              task.completed === false
            )
          default:
            // NOTE: Break out of the loop as soon as the next incomplete task is found
            return (
              task.timestamp + task.completionWindow >= Date.now() &&
              task.completed === false
            )
        }
      })
    }
  }
}
