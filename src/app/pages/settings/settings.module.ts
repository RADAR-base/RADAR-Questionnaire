import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { SettingsPageComponent } from './containers/settings-page.component'
import { SettingsService } from './services/settings.service'

const routes: Routes = [
  {
    path: 'settings',
    component: SettingsPageComponent,
    canActivate: [AuthGuard]
  }
]

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    IonicModule.forRoot(SettingsPageComponent),
    RouterModule.forChild(routes)
  ],
  declarations: [SettingsPageComponent],
  providers: [SettingsService]
})
export class SettingsModule {}
