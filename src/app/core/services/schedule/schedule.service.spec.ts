import { TestBed } from '@angular/core/testing'

import {
  LogServiceMock,
  ScheduleGeneratorServiceMock,
  StorageServiceMock
} from '../../../shared/testing/mock-services'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'
import { ScheduleService } from './schedule.service'

describe('ScheduleService', () => {
  let service

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ScheduleService,
        {
          provide: ScheduleGeneratorService,
          useClass: ScheduleGeneratorServiceMock
        },
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: LogService, useClass: LogServiceMock }
      ]
    })
  )

  beforeEach(() => {
    service = TestBed.get(ScheduleService)
  })

  it('should create', () => {
    expect(service instanceof ScheduleService).toBe(true)
  })
})
