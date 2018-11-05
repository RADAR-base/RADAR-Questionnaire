import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { SettingsPageComponent } from './containers/settings-page.component'

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    IonicModule.forRoot(SettingsPageComponent)
  ],
  declarations: [SettingsPageComponent]
})
export class SettingsModule {}
