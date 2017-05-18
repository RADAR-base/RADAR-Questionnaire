import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
var configFile = '../assets/data/config.json';

@Injectable()
export class ConfigDataProvider  {
	
  items: FirebaseListObservable<any[]>
  constructor(
  			  public http: Http,	
  			  private db: AngularFireDatabase
  			  ) 
  			
  			{
  					// fetch config.json from firebase.
		  			this.fetchConfig()
		  			
  		    }

 

 fetchConfig(){

 			// Data will be updated when changes made in firebase console.

 			this.items = this.db.list('/assessments')
 			this.items.subscribe(snapshots=>{
 			 	snapshots.forEach(item => {
			        console.log('Item:', item)
			    });
			});
		         
 }


}
