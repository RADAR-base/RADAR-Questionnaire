import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { TokenFormComponent } from './components/token-form/token-form.component'
import { EnrolmentPageComponent } from './containers/enrolment-page.component'
import { AuthService } from './services/auth.service'

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(EnrolmentPageComponent),
    PipesModule
  ],
  declarations: [EnrolmentPageComponent, TokenFormComponent],
  providers: [AuthService]
})
export class AuthModule {}
