import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { CacheSendModalComponent } from './components/cache-send-modal/cache-send-modal.component'
import { SettingsPageComponent } from './containers/settings-page.component'
import { SettingsService } from './services/settings.service'

const routes: Routes = [
  {
    path: '',
    component: SettingsPageComponent,
    canActivate: [AuthGuard]
  }
]

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    IonicModule.forRoot(),
    RouterModule.forChild(routes)
  ],
  declarations: [SettingsPageComponent, CacheSendModalComponent],
  providers: [SettingsService],
})
export class SettingsModule {}
