import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { CacheSendModalComponent } from './components/cache-send-modal/cache-send-modal.component'
import { SettingsPageComponent } from './containers/settings-page.component'
import { SettingsService } from './services/settings.service'

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    IonicModule.forRoot(SettingsPageComponent)
  ],
  declarations: [SettingsPageComponent, CacheSendModalComponent],
  providers: [SettingsService],
  entryComponents: [CacheSendModalComponent]
})
export class SettingsModule {}
