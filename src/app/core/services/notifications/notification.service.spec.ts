import { TestBed } from '@angular/core/testing'

import { StorageServiceMock } from '../../../shared/testing/mock-services'
import { GlobalStorageService } from '../storage/global-storage.service'
import { StorageService } from '../storage/storage.service'
import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: GlobalStorageService, useClass: StorageServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(NotificationService)
  })

  it('should create', () => {
    expect(service instanceof NotificationService).toBe(true)
  })
})
