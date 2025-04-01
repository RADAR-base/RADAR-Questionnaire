import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { QRFormComponent } from './components/qr-form/qr-form.component'
import { TokenFormComponent } from './components/token-form/token-form.component'
import { EnrolmentPageComponent } from './containers/enrolment-page.component'
import { AuthGuard } from './services/auth.guard'
import { AuthService } from './services/auth.service'
import { OryFormComponent } from './components/ory-form/ory-form.component'
import { AuthFactoryService } from './services/auth-factory.service'
import { MpAuthService } from './services/mp-auth.service'
import { OryAuthService } from './services/ory-auth.service'

const routes: Routes = [
  {
    path: '',
    component: EnrolmentPageComponent
  }
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
    PipesModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [EnrolmentPageComponent, TokenFormComponent, QRFormComponent, OryFormComponent],
  providers: [MpAuthService, OryAuthService, AuthGuard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthModule { }
