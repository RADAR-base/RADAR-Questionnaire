import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { PipesModule } from '../../shared/pipes/pipes.module';
import { ReportPageComponent } from './containers/report-page.component';

@NgModule({
  imports: [CommonModule, PipesModule, IonicModule.forRoot()],
  declarations: [ReportPageComponent],
})
export class ReportModule {}
