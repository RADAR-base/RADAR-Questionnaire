import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { UsageService } from '../../../../core/services/usage/usage.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { QuestionsService } from '../../services/questions.service'

@Component({
  selector: 'finish',
  templateUrl: 'finish.component.html',
  styleUrls: ['finish.component.scss']
})
export class FinishComponent implements OnChanges {
  @Input()
  content = ''
  @Input()
  showDoneButton: boolean
  @Input()
  isShown: boolean
  @Input()
  requiresInClinicCompletion = false
  @Input()
  taskType: AssessmentType
  @Input()
  isLastTask = false
  @Input()
  task
  @Input()
  questions
  @Output()
  exit: EventEmitter<any> = new EventEmitter<any>()

  displayNextTaskReminder = true
  completedInClinic = false

  constructor(
    private usage: UsageService,
    private questionsService: QuestionsService
  ) {}

  ngOnChanges() {
    this.displayNextTaskReminder =
      this.taskType == AssessmentType.SCHEDULED && !this.isLastTask
    if (this.isShown) {
      this.onQuestionnaireCompleted()
      this.usage.setPage(this.constructor.name)
      setTimeout(() => (this.showDoneButton = true), 10000)
    }
  }

  onQuestionnaireCompleted() {
    return this.questionsService.processCompletedQuestionnaire(
      this.task,
      this.questions
    )
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }

  toggleChanged(event) {
    this.completedInClinic = event
  }
}
