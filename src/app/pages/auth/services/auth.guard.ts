import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'

import { TokenService } from '../../../core/services/token/token.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(public token: TokenService, private router: Router) { }

  canActivate() {
    return this.token
      .isValid()
      .catch(() => false)
      .then(res => (res ? true : this.resetAndEnrol()))
  }

  resetAndEnrol() {
    return this.router.navigate(['/enrol'])
  }
}
