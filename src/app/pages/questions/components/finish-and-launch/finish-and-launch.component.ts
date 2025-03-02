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
  templateUrl: 'finish-and-launch.component.html',
  styleUrls: ['finish-and-launch.component.scss'],
  standalone: false,
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

  canLaunch = false
  externalAppLaunchDescription = ''

  constructor(
    private usage: UsageService,
    private localization: LocalizationService,
    private appLauncher: AppLauncherService
  ) {}

  ngOnInit() {
    this.appLauncher.isExternalAppCanLaunch(this.externalApp, this.task).then(canLaunch=>{
      this.canLaunch = canLaunch
      this.externalAppLaunchDescription = this.getExternalAppLaunchDescription(this.canLaunch)
    }).catch(err=>{
      console.log(err)
      this.externalAppLaunchDescription = this.getExternalAppLaunchDescription(false)
    })
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

  getExternalAppLaunchDescription(canLaunch: boolean) {
    const options = this.appLauncher.getAppLauncherOptions(
      this.externalApp,
      this.task
    )
    if(canLaunch){
      return this.externalApp.field_label && this.externalApp.field_label.length ?
        (this.externalApp.field_label) : (this.localization.translateKey(LocKeys.EXTERNAL_APP_LAUNCH_DESC) + ' ' +
          (this.externalApp.external_app_name? this.externalApp.external_app_name : options.uri.toString()))
    }else{
      return (this.externalApp.external_app_name?
          this.externalApp.external_app_name : options.uri.toString())
        + ' ' + this.localization.translateKey(LocKeys.EXTERNAL_APP_FAILURE_ON_VALIDATING)
    }
  }

  toggleChanged(event) {
    this.completedInClinic = event
  }
}
