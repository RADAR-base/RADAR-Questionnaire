import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { StorageService } from '../providers/storage-service'
import { SchedulingService } from '../providers/scheduling-service'
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';


@Injectable()
export class FirebaseService {

  items: FirebaseObjectObservable<any[]>
  firebaseDataBase: any


  constructor(
    public http: Http,
    private fireDb: AngularFireDatabase,
    private storage: StorageService,
    private schedule: SchedulingService,
  ) {
    // fetch config from firebase
    this.fetchConfigState()
  }

  fetchConfigState() {

    this.firebaseDataBase = this.fireDb.app.database()
    //create any reference point from the firebaseDataBase with .ref('/<NODE_NAME>')
    var ref = this.firebaseDataBase.ref('version')
    //if version is changed fetch the config data
    //ref.on : listen always
    //ref.once : listen once changed and detach the listener
    ref.once("value", snapshot => {
      // this.fireDb.object('/') pulls all the child nodes
      // can be changed accordingly
      this.fireDb.object('/').subscribe(configData => {
        this.storage.setFetchedConfiguration(configData).then(() => {
          this.schedule.generateSchedule()
        })
      })
    })
  }
}
