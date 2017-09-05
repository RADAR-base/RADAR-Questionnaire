
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import { Http, Response } from '@angular/http'
import { Utility } from './util'

@Injectable()
export class AndroidPermissionUtility {

  util: any
  permissionStatus: Boolean



  constructor(
    private http: Http,
    private device: Device,
    private utility: Utility,
    private androidPermissions: AndroidPermissions
  ) {

    // device.platform holds both platforms, ios and android
    // currently permissions are taken only on android
    // TODO: incase "IOS" add respective permissions

    /*this.util = utility.getDevice()
    if (this.util.device.platform === 'Android') {
      this.AuthorizePermissions()
    }*/
  }

  permissionList: string[] = [
    this.androidPermissions.PERMISSION.CAMERA,
    this.androidPermissions.PERMISSION.RECORD_AUDIO,
    this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
  ]

  AuthorizePermissions() {
    // check permissions at first
    this.permissionList.forEach(permission => {
      this.checkPermission(permission)
    })
  }



  fetchPermission(permission) {
    this.androidPermissions.requestPermissions(permission).then(
      function(success) {
        this.permissionStatus = true;
        console.log('Permissions obtained')
      }, function(err) {
        this.permissionStatus = false;
        console.log('Permissions denied')
      }
    )
  }

  getPermissionStatus() {
    return this.permissionStatus
  }

  checkPermission(permission: string) {
    this.androidPermissions.checkPermission(permission).then(
      success => console.log(permission + ': Permission obtained'),
      error => {
        this.fetchPermission(permission)
      }
    )
  }


}
