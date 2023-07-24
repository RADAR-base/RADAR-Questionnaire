import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { OnDemandPageComponent } from './containers/on-demand-page.component'
import { OnDemandService } from './services/on-demand.service'

const routes: Routes = [
  {
    path: '',
    component: OnDemandPageComponent,
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
  declarations: [OnDemandPageComponent],
  providers: [OnDemandService]
})
export class OnDemandModule {}
