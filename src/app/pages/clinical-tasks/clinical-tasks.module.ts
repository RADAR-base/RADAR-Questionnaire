import { ClinicalTasksPageComponent } from './containers/clinical-tasks-page.component'
import { ClinicalTasksService } from './services/clinical-tasks.service'
import { CommonModule } from '@angular/common'
import { IonicModule } from 'ionic-angular'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../shared/pipes/pipes.module'

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
