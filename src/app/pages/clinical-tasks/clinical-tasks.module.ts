import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { ClinicalTasksPageComponent } from './containers/clinical-tasks-page.component'
import { ClinicalTasksService } from './services/clinical-tasks.service'

const routes: Routes = [
  {
    path: '',
    component: ClinicalTasksPageComponent,
    canActivate: [AuthGuard]
  }
]

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(),
    RouterModule.forChild(routes)
  ],
  declarations: [ClinicalTasksPageComponent],
  providers: [ClinicalTasksService]
})
export class ClinicalTasksModule {}
