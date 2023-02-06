import { TestBed } from '@angular/core/testing'
import { Platform } from 'ionic-angular'
import { PlatformMock } from 'ionic-mocks'

import { LogService } from '../misc/log.service'

describe('LogService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [LogService, { provide: Platform, useClass: PlatformMock }]
    })
  )

  beforeEach(() => {
    service = TestBed.get(LogService)
  })

  it('should create', () => {
    expect(service instanceof LogService).toBe(true)
  })
})
