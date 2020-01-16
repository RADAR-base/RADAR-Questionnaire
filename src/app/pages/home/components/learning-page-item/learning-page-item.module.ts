import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { LearningPageItemComponent } from "./learning-page-item.component";

const COMPONENTS = [LearningPageItemComponent]

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(LearningPageItemComponent),
    PipesModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class LearningPageItemModule {}
