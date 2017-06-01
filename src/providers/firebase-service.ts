import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { File } from '@ionic-native/file';
import 'rxjs/add/operator/map';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
var configFile = '../assets/data/config.json';

@Injectable()
export class FirebaseService  {

  items:FirebaseListObservable<any[]>
  firebaseDataBase:any

  private filePath:string        //config.json file path
  private configFileName:string  //file name "config.json"

  constructor(
  			  public http: Http,
  			  private db: AngularFireDatabase,
  			  private file: File
  			  ){
              this.filePath = this.file.applicationDirectory +"/www/assets/data"
              this.configFileName = "config.json"

  					  //fetch config.json from firebase DB.
		  			     this.fetchConfigState()
                 console.log(this.dummy())
		  	   }

dummy(){
return "hello"
}


 fetchConfigState(){

 			 //Local config file will be updated in real time when config file is updated from firebase console.
       this.firebaseDataBase = this.db.app.database()

       //create any reference point from the firebaseDataBase with .ref('/<NODE_NAME>')
       var ref = this.firebaseDataBase.ref('assessments')

       // if version is changed update the local config file with changes
       ref.on("value", snapshot => {
              this.updateConfigfile()
            })
 }

updateConfigfile(){

    var assessments = this.db.object('/') //fetch the config.json changes from Firebase

    if(this.checkFileExists(this.filePath,this.configFileName) == true){
      this.file.writeExistingFile(this.filePath,this.configFileName,JSON.stringify(assessments))
      .then(function(res){
        console.log("Config.json Succesfully updated");
      },function(error){
        console.log("Error updating Config.json: " + error)
      })
    }else{
        console.log("File Does not exist !")
    }

 }

 checkFileExists(filePath:string,fileName:string):any
 {
   this.file.checkFile(filePath,fileName)
   .then(function(res){
      return true
   },function(err){
      console.log("File does not exist")
      return false
   });
 }


}
