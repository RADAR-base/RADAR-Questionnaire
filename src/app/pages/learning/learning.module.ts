import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { SettingsPageComponent } from './containers/settings-page.component'
import { SettingsService } from './services/settings.service'
import {LearningPageItemComponent} from "./components/learning-page-item.component";
import {LearningPageComponent} from "./containers/learning-page.component";

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    IonicModule.forRoot(LearningPageComponent)
  ],
  declarations: [
    LearningPageItemComponent,
    LearningPageComponent
  ],
  exports: [
    LearningPageComponent
  ]
})
export class LearningModule {}
