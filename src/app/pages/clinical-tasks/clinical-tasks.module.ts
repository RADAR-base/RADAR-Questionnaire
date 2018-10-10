import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { ClinicalTasksPageComponent } from './containers/clinical-tasks-page.component'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(ClinicalTasksPageComponent)
  ],
  declarations: [ClinicalTasksPageComponent]
})
export class ClinicalTasksModule {}
