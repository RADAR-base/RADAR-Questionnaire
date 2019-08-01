import { CommonModule } from '@angular/common'
import { IonicModule } from 'ionic-angular'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../shared/pipes/pipes.module'
import { ReportPageComponent } from './containers/report-page.component'

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    IonicModule.forRoot(ReportPageComponent)
  ],
  declarations: [ReportPageComponent]
})
export class ReportModule {}
