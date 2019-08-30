import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { QRFormComponent } from './components/qr-form/qr-form.component'
import { TokenFormComponent } from './components/token-form/token-form.component'
import { EnrolmentPageComponent } from './containers/enrolment-page.component'
import { AuthGuard } from './services/auth.guard'
import { AuthService } from './services/auth.service'

const routes: Routes = [
  {
    path: 'enrol',
    component: EnrolmentPageComponent
  }
]
@NgModule({
  imports: [
    CommonModule,
    IonicModule.forRoot(EnrolmentPageComponent),
    PipesModule,
    RouterModule.forChild(routes)
  ],
  declarations: [EnrolmentPageComponent, TokenFormComponent, QRFormComponent],
  providers: [AuthService, AuthGuard]
})
export class AuthModule {}
