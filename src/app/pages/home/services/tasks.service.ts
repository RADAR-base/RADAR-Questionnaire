import {
  DefaultESMCompletionWindow,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { Task, TasksProgress } from '../../../shared/models/task'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'

import { Injectable } from '@angular/core'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { setDateTimeToMidnight } from '../../../shared/utilities/time'

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
      this.getTasksOfToday()
    ]).then(([assessment, tasks]) => {
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        task: task,
        assessment: assessment,
        type: type,
        isLastTask: this.isLastTask(tasks)
      }
    })
  }

  evalHasClinicalTasks() {
    return this.questionnaire.getHasClinicalTasks()
  }

  getTasksOfToday() {
    return this.schedule
      .getTasksForDate(new Date(), TaskType.NON_CLINICAL)
      .then(tasks =>
        tasks.filter(
          t => !this.isTaskExpired(t) || this.wasTaskCompletedToday(t)
        )
      )
  }

  getSortedTasksOfToday(): Promise<Map<number, Task[]>> {
    return this.getTasksOfToday().then(tasks => {
      const sortedTasks = new Map()
      tasks.forEach(t => {
        const midnight = setDateTimeToMidnight(new Date(t.timestamp)).getTime()
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

  /**
   * This function Retrieves the most current next task from a list of tasks.
   * @param tasks : list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  getNextTask(tasks: Task[]): Task | undefined {
    if (tasks) {
      return tasks.find(task => !this.isTaskExpired(task))
    }
  }

  getCurrentDateMidnight() {
    return setDateTimeToMidnight(new Date())
  }
}
