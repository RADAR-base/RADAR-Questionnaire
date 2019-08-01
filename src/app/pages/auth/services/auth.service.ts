import 'rxjs/add/operator/toPromise'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultEndPoint,
  DefaultManagementPortalURI,
  DefaultMetaTokenURI,
  DefaultRefreshTokenRequestBody,
  DefaultRequestEncodedContentType,
  DefaultRequestJSONContentType,
  DefaultSourceTypeRegistrationBody,
  DefaultSubjectsURI
} from '../../../../assets/data/defaultConfig'
import { StorageService } from '../../../core/services/storage.service'
import { TokenService } from '../../../core/services/token.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { MetaToken } from '../../../shared/models/token'

@Injectable()
export class AuthService {
  URI_base: string

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private token: TokenService
  ) {
    this.updateURI()
  }

  updateURI() {
    return this.storage.get(StorageKeys.BASE_URI).then(uri => {
      this.URI_base = (uri ? uri : DefaultEndPoint) + DefaultManagementPortalURI
    })
  }

  registerToken(registrationToken): Promise<void> {
    const refreshBody = DefaultRefreshTokenRequestBody + registrationToken
    return this.token.register(refreshBody)
  }

  getRefreshTokenFromUrl(url): Promise<MetaToken> {
    return this.http.get(url).toPromise()
  }

  getURLFromToken(base, token) {
    return base + DefaultMetaTokenURI + token
  }

  getSubjectURI(subject) {
    return this.URI_base + DefaultSubjectsURI + subject
  }

  getSubjectInformation() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestEncodedContentType),
      this.token.getDecodedSubject()
    ]).then(([headers, subject]) =>
      this.http.get(this.getSubjectURI(subject), { headers }).toPromise()
    )
  }

  registerAsSource() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestJSONContentType),
      this.token.getDecodedSubject()
    ]).then(([headers, subject]) =>
      this.http
        .post(
          this.getSubjectURI(subject) + '/sources',
          DefaultSourceTypeRegistrationBody,
          {
            headers
          }
        )
        .toPromise()
    )
  }
}
