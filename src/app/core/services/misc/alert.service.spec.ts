import { TestBed } from '@angular/core/testing'
import { AlertController } from 'ionic-angular'
import { AlertControllerMock } from 'ionic-mocks'

import { AlertService } from './alert.service'

describe('AlertService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: AlertController, useClass: AlertControllerMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(AlertService)
  })

  it('should create', () => {
    expect(service instanceof AlertService).toBe(true)
  })
})
