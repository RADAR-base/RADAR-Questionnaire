import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { RoundProgressModule } from 'angular-svg-round-progressbar'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { TaskInfoComponent } from './task-info.component'

const COMPONENTS = [TaskInfoComponent]

@NgModule({
  imports: [
    RoundProgressModule,
    CommonModule,
    IonicModule.forRoot(),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskInfoModule {}
