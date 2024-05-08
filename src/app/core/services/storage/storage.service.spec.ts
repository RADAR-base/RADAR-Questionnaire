import { TestBed } from '@angular/core/testing'
import { IonicStorageModule } from '@ionic/storage'

import { LogServiceMock } from '../../../shared/testing/mock-services'
import { LogService } from '../misc/log.service'
import { StorageService } from './storage.service'

describe('StorageService', () => {
  let service

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IonicStorageModule.forRoot()],
      providers: [
        StorageService,
        { provide: LogService, useClass: LogServiceMock },
        { provide: Storage, useValue: StorageMock }
      ]
    })
  })

  beforeEach(() => {
    service = TestBed.get(StorageService)
  })

  it('should create', () => {
    expect(service instanceof StorageService).toBe(true)
  })
})

const StorageMock: any = {
  get: () => new Promise<any>((resolve, reject) => resolve('')),
  set: () => Promise.resolve()
}
