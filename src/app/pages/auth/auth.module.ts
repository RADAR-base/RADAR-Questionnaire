import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { QRFormComponent } from './components/qr-form/qr-form.component'
import { TokenFormComponent } from './components/token-form/token-form.component'
import { WelcomePageComponent } from "./components/welcome-page/welcome-page.component";
import { EnrolmentPageComponent } from './containers/enrolment-page.component'
import { AuthService } from './services/auth.service'

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(WelcomePageComponent),
    PipesModule
  ],
  declarations: [
    EnrolmentPageComponent,
    WelcomePageComponent,
    TokenFormComponent,
    QRFormComponent
  ],
  providers: [AuthService]
})
export class AuthModule {}
