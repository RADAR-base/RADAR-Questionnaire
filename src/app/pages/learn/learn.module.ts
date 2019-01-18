import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import {LearnPageComponent} from "./containers/learn-page.component";
import {FooterNavbarModule} from "../footer-navbar/footer-navbar.module";

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    FooterNavbarModule,
    IonicModule.forRoot(LearnPageComponent)
  ],
  declarations: [
    LearnPageComponent
  ],
  exports: [
    LearnPageComponent
  ]


})
export class LearnModule {}
