import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { HealthQuestionnaireProcessorService } from './services/health-questionnaire-processor.service'
import { HealthkitPageComponent } from './containers/healthkit-page.component'
import { ToolbarComponent } from '../../questions/components/toolbar/toolbar.component'

const routes: Routes = [
  {
    path: '',
    component: HealthkitPageComponent
  }
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule.forRoot(),
    RouterModule.forChild(routes)
  ],
  declarations: [
    HealthkitPageComponent,],
  providers: [
    HealthQuestionnaireProcessorService,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HealthkitModule { }
