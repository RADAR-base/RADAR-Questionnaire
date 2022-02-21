import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { UsageService } from '../../../../core/services/usage/usage.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { AssessmentType } from '../../../../shared/models/assessment'
import { ExternalApp } from '../../../../shared/models/question'
import { Task } from '../../../../shared/models/task'
import { AppLauncherService } from '../../services/app-launcher.service'

@Component({
  selector: 'finish-and-launch',
  templateUrl: 'finish-and-launch.component.html'
})
export class FinishAndLaunchComponent implements OnInit, OnChanges {
  @Input()
  externalApp: ExternalApp
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
  task: Task
  @Output()
  exit: EventEmitter<any> = new EventEmitter<any>()

  displayNextTaskReminder = true
  completedInClinic = false

  canLaunch = true
  externalAppLaunchDescription = ''

  constructor(
    private usage: UsageService,
    private localization: LocalizationService,
    private appLauncher: AppLauncherService
  ) {}

  ngOnInit() {
    this.getExternalAppLaunchDescription()
  }

  ngOnChanges() {
    this.displayNextTaskReminder =
      this.taskType == AssessmentType.SCHEDULED && !this.isLastTask
    if (this.isShown) {
      this.usage.setPage(this.constructor.name)
      setTimeout(() => (this.showDoneButton = true), 15000)
    }
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }

  getExternalAppLaunchDescription() {
    const options = this.appLauncher.getAppLauncherOptions(
      this.externalApp,
      this.task
    )
    this.externalAppLaunchDescription =
      this.externalApp.field_label && this.externalApp.field_label.length
        ? this.externalApp.field_label
        : this.localization.translateKey(LocKeys.EXTERNAL_APP_LAUNCH_DESC) +
          ' ' +
          (this.externalApp.external_app_name
            ? this.externalApp.external_app_name
            : options.uri.toString())
  }
}
