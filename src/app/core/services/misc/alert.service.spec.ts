import { TestBed } from '@angular/core/testing'
import { AlertController } from '@ionic/angular'

import { AlertService } from './alert.service'

describe('AlertService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        AlertService,
        AlertController
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
