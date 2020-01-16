import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { LearningPageItemModule } from "../learning-page-item/learning-page-item.module";
import { LearningPageComponent } from "./learning-page.component";

const COMPONENTS = [LearningPageComponent]

@NgModule({
  imports: [
    CommonModule,
    LearningPageItemModule,
    IonicModule.forRoot(LearningPageModule),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class LearningPageModule {}
