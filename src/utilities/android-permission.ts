import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import { Http, Response } from '@angular/http'
import { Utility } from './util'

declare var cordova: any

@Injectable()
export class AndroidPermissionUtility {

  util: any
  permissionState: any
  permissionGrantedList = []
  permissionDeniedList = []
  permissionCheckedCount: number = 0


  constructor(
    private http: Http,
    private device: Device,
    private utility: Utility,
    private androidPermissions: AndroidPermissions
  ) {
  }

  // Add required permissions to this list
  androidPermissionList: string[] = [
    this.androidPermissions.PERMISSION.RECORD_AUDIO,
    this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
  ]

  AuthorizePermissions() {

    // device.platform holds both platforms, ios and android
    // currently permissions are taken only on android
    // TODO: incase "IOS" add respective permission

    this.androidPermissions.requestPermissions(this.androidPermissionList).then((success) => {
      console.log(success)
      this.checkPermissions()
    }, (error) => {
      console.log(error)
    })
  }


  checkPermissions(): Promise<any> {

    return new Promise((resolve, reject) => {
      this.permissionGrantedList = []
      this.permissionDeniedList = []

      this.androidPermissionList.forEach(permission => {

        this.androidPermissions.checkPermission(permission).then(
          success => {
            console.log("count:" + this.permissionCheckedCount)
            if (success.hasPermission == true) {
              this.permissionGrantedList.push(permission)
            } else {
              this.permissionDeniedList.push(permission)
            }
          },
          err => {
            reject(err)
            console.log(err)
          }
        )
      })
      resolve(true)
    })
  }

  getPermissionStatus() {
    if (this.permissionDeniedList.length == 0) {
      return true
    } else {
      return false
    }
  }


  checkIndividualPermission(permission) {

  }


}
