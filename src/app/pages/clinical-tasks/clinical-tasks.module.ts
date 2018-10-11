import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { ClinicalTasksPageComponent } from './containers/clinical-tasks-page.component'
import { ClinicalTasksService } from './services/clinical-tasks.service'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(ClinicalTasksPageComponent)
  ],
  declarations: [ClinicalTasksPageComponent],
  providers: [ClinicalTasksService]
})
export class ClinicalTasksModule {}
