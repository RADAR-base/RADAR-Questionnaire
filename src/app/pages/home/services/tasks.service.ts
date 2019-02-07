import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { Task, TasksProgress } from '../../../shared/models/task'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'
import { getMilliseconds } from '../../../shared/utilities/time'

@Injectable()
export class TasksService {
  constructor(
    private schedule: ScheduleService,
    private localization: LocalizationService,
    private questionnaire: QuestionnaireService
  ) {}

  getQuestionnairePayload(task) {
    const type = getTaskType(task)
    return this.questionnaire.getAssessment(type, task).then(assessment => {
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        task: task,
        assessment: assessment,
        type: type
      }
    })
  }

  evalHasClinicalTasks() {
    return this.questionnaire.getHasClinicalTasks()
  }

  getTasksOfToday() {
    return this.schedule.getTasksForDate(new Date(), TaskType.NON_CLINICAL)
  }

  getTaskProgress(tasks): TasksProgress {
    const tasksProgress: TasksProgress = {
      numberOfTasks: 0,
      completedTasks: 0
    }
    if (tasks) {
      tasksProgress.numberOfTasks = tasks.length
      tasksProgress.completedTasks = tasks.reduce(
        (num, t) => (t.completed ? num + 1 : num),
        0
      )
      return tasksProgress
    }
  }

  getIncompleteTasks() {
    return this.schedule.getIncompleteTasks()
  }

  updateTaskToReportedCompletion(task) {
    this.schedule.updateTaskToReportedCompletion(task)
  }

  areAllTasksComplete(tasks) {
    return !tasks || tasks.every(t => t.name === 'ESM' || t.completed)
  }

  isLastTask(task, tasks) {
    return (
      !tasks ||
      tasks.every(
        t => t.name === 'ESM' || t.completed || t.index === task.index
      )
    )
  }

  isTaskValid(task) {
    const now = new Date().getTime()
    if (
      task.timestamp <= now &&
      task.timestamp + task.completionWindow > now &&
      !task.completed
    ) {
      return true
    } else {
      return false
    }
  }

  /**
   * This function Retrieves the most current next task from a list of tasks.
   * @param tasks : list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  getNextTask(tasks: Task[]): Task | undefined {
    if (tasks) {
      const tenMinutesAgo =
        new Date().getTime() - getMilliseconds({ minutes: 10 })
      const midnight = new Date()
      midnight.setHours(0, 0, 0, 0)
      const offsetForward = getMilliseconds({ hours: 12 })
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
              task.timestamp >= midnight.getTime() && task.completed === false
            )
        }
      })
    }
  }
}
