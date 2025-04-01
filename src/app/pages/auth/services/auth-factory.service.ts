import { Injectable } from '@angular/core'
import { OryAuthService } from './ory-auth.service'
import { MpAuthService } from './mp-auth.service'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root',
})
export class AuthFactoryService {
  constructor(
    private oryAuthService: OryAuthService,
    private mpAuthService: MpAuthService
  ) { }

  getAuthService(authType: string): AuthService {
    switch (authType) {
      case 'ory':
        return this.oryAuthService
      case 'qr':
      case 'token':
        return this.mpAuthService
      default:
        throw new Error('Invalid Auth Type')
    }
  }
}
