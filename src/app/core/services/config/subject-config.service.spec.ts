import { TestBed } from '@angular/core/testing'

import { StorageServiceMock } from '../../../shared/testing/mock-services'
import { StorageService } from '../storage/storage.service'
import { SubjectConfigService } from './subject-config.service'

describe('SubjectConfigService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        SubjectConfigService,
        { provide: StorageService, useClass: StorageServiceMock }
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
