import { TestBed } from '@angular/core/testing'

import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [NotificationService]
    })
  )

  beforeEach(() => {
    service = TestBed.get(NotificationService)
  })

  it('should create', () => {
    expect(service instanceof NotificationService).toBe(true)
  })
})
