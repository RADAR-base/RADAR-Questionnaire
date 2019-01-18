import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../../shared/pipes/pipes.module'
import {FooterNavbarComponent} from "./containers/footer-navbar.component";

@NgModule({
  imports: [
    MomentModule,
    CommonModule,
    PipesModule,
    IonicModule.forRoot(FooterNavbarComponent)
  ],
  declarations: [
    FooterNavbarComponent
  ],
  exports: [
    FooterNavbarComponent
  ]
})
export class FooterNavbarModule {}
