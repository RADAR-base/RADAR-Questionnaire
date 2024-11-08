import { HttpClient, HttpHandler } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'

import {
  StorageServiceMock,
  TokenServiceMock
} from '../../../shared/testing/mock-services'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { SubjectConfigService } from './subject-config.service'

describe('SubjectConfigService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        SubjectConfigService,
        { provide: StorageService, useClass: StorageServiceMock },
        HttpClient,
        HttpHandler,
        { provide: TokenService, useClass: TokenServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(SubjectConfigService)
  })

  it('should create', () => {
    expect(service instanceof SubjectConfigService).toBe(true)
  })
})
