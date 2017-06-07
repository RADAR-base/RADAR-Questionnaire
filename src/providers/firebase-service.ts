import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { StorageService } from '../providers/storage-service'
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';


@Injectable()
export class FirebaseService {

  items: FirebaseObjectObservable<any[]>
  firebaseDataBase: any


  constructor(
    public http: Http,
    private db: AngularFireDatabase,
    private storage: StorageService
  ) {
    // fetch config from firebase
    this.fetchConfigState()
  }

  fetchConfigState() {

    this.firebaseDataBase = this.db.app.database()

    //create any reference point from the firebaseDataBase with .ref('/<NODE_NAME>')
    var ref = this.firebaseDataBase.ref('version')

    //if version is changed fetch the config data
    //ref.on : listen always
    //ref.once : listen once changed and detach the listener

    ref.once("value", snapshot => {
      // this.db.object('/') pulls all the child nodes
      // can be changed accordingly
      this.db.object('/').subscribe(configData => {
        this.updateConfigData("config", configData) //key :"config"
      })
    })
  }

  updateConfigData(key, data) {
    // save and update the config data in local storage
    this.storage.set(key, data).then(result => {
      console.log(result)
    }, error => {
      console.log(error)
    })
  }


}
