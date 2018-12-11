import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { EnrolmentPageComponent } from './containers/enrolment-page.component'
import { AuthService } from './services/auth.service'
import { KeycloakService } from "./services/keycloak.service";
import {WelcomePageComponent} from "./components/welcome-page/welcome-page.component";

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(WelcomePageComponent),
    PipesModule
  ],
  entryComponents: [
    EnrolmentPageComponent,
  ],
  declarations: [
    EnrolmentPageComponent,
    WelcomePageComponent,
  ],
  providers: [
    AuthService,
    KeycloakService
  ]
})
export class AuthModule {}
