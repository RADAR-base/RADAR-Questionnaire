import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { QRFormComponent } from './components/qr-form/qr-form.component'
import { TokenFormComponent } from './components/token-form/token-form.component'
import { WelcomePageComponent } from "./components/welcome-page/welcome-page.component";
import { AuthService } from './services/auth.service'
import { KeycloakAuthService } from "./services/keycloak.auth.service";
import { EligibilityPageComponent } from "./components/eligibility-page/eligibility-page.component";
import { ConsentPageComponent } from "./components/consent-page/consent-page.component";

@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(WelcomePageComponent),
    PipesModule
  ],
  entryComponents: [
    EligibilityPageComponent,
    ConsentPageComponent
  ],
  declarations: [
    ConsentPageComponent,
    WelcomePageComponent,
    EligibilityPageComponent,
    TokenFormComponent,
    QRFormComponent
  ],
  providers: [
    { provide: AuthService, useClass: KeycloakAuthService}
  ]
})
export class AuthModule {}
