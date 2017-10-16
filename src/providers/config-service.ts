import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { StorageService } from '../providers/storage-service'
import { SchedulingService } from '../providers/scheduling-service'
import { ConfigData } from '../assets/data/configData'

@Injectable()
export class ConfigService {

  constructor(
    public http: Http,
    private storage: StorageService,
    private schedule: SchedulingService,
  ) {
    this.fetchConfigState()
  }

  fetchConfigState() {
    // fetch configFile here
    this.storage.setFetchedConfiguration(ConfigData).then(() => {
      this.schedule.generateSchedule()
    })
  }
}
