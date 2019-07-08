import { AuthService } from './services/auth.service'
import { CommonModule } from '@angular/common'
import { EnrolmentPageComponent } from './containers/enrolment-page.component'
import { IonicModule } from 'ionic-angular'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../shared/pipes/pipes.module'
import { TokenFormComponent } from './components/token-form/token-form.component'

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
